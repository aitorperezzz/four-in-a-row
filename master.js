let Room = require('./room.js');

// The master class controls the game logic server side
module.exports = class Master {
    constructor() {
        this.rooms = [];
    }

    // A client wants to play and sends its socket id
    ready(socketId) {
        console.log('Client ' + socketId + ' wants to play');

        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].register(socketId)) {
                console.log('Registered socket id ' + socketId + ' in an existing room');
                return;
            }
        }

        // There is no room available, so create a new one
        console.log('Creating a new room for socket id ' + socketId);
        this.rooms.push(new Room([socketId]));
    }

    // A client has sent a click. The click has already been processed by the client in order
    // to minimise the number of these messages
    clicked(socketId, col) {
        console.log('Receiving a click from client ' + socketId + ' on column ' + col);

        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].clicked(socketId, col)) {
                return;
            }
        }

        console.log('Warning: click of a client that does not belong to any room');
    }

    // A client has left a room
    leave(socketId) {

        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].unregister(socketId)) {
                console.log('Client ' + socketId + ' has left its room');
                return;
            }
        }

        console.log('Client ' + socketId + ' has disconnected');
    }

    // A client wants to play again
    again(socketId) {
        console.log('A client wants to play again');

        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].again(socketId)) {
                return;
            }
        }
    }
};
