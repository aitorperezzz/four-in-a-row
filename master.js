let Room = require('./room.js');

// The master class controls the game logic server side
module.exports = class Master {
    constructor() {
        this.rooms = [];

        // Decide the size of the canvas.
        this.canvasx = 600;
        this.canvasy = 500;
        this.boardsize = 150;

        // Calculate relevant positions for the game.
        this.xsize = Math.min(this.canvasx, this.canvasy - this.boardsize) * 6 / 7;
        this.size = this.xsize / 7;
        this.ysize = this.size * 6;

        // Calculate initial positions for the grid.
        this.initialx = (this.canvasx - this.xsize) / 2;
        this.initialy = this.boardsize + (this.canvasy - this.boardsize - this.ysize) / 2;

        // Calculate starting positions for the discs.
        this.discx = this.initialx + this.size / 2;
        this.discy = this.initialy + this.ysize - this.size / 2;

        // Bundle some information for the clients, to send later.
        this.clientData = {
            canvasx: this.canvasx,
            canvasy: this.canvasy,
            boardsize: this.boardsize,
            xsize: this.xsize,
            ysize: this.ysize,
            size: this.size,
            initialx: this.initialx,
            initialy: this.initialy
        };
    }

    // A client wants to play and sends its socket id
    ready(data) {
        console.log('Client ' + data.socketId + ' wants to play');

        // Try to register the client in any of the rooms already available
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].register(data.socketId)) {
                console.log('Registered socket id ' + data.socketId + ' in an existing room');
                return;
            }
        }

        // There is no room available, so create a new one
        console.log('Creating a new room for socket id ' + data.socketId);
        this.rooms.push(new Room([data.socketId]));
    }

    // A client has sent a click. The click has already been processed by the client in order
    // to minimise the number of these messages
    clicked(data) {
        console.log('Receiving a click from client ' + data.socketId);
        console.log(data);

        // Try to process the click in any of the rooms already available
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].clicked(data)) {
                return;
            }
        }

        console.log('Warning: click of a client that does not belong to any room');
    }

    // A client has left a room
    leave(data) {
        console.log('A client has left its room');

        // Try to unregister the client in any of the rooms
        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].unregister(data.socketId)) {
                return;
            }
        }
    }
};
