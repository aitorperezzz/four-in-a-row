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
        this.rooms.push(new Room(this.getRoomId(), [socketId]));
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
                // The room has been dissolved, so remove it from the server
                this.rooms.splice(i, 1);
                console.log('Room deleted. Current number of rooms: ' + this.rooms.length);
                return;
            }
        }
        console.log('Disconnect of a client that does not belong to any room');
    }

    // A client wants to play again
    again(socketId) {
        console.log('Client ' + socketId + ' wants to play again');

        for (let i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].again(socketId)) {
                return;
            }
        }
        console.log('Warning: client ' + socketId + ' not found in any room wants to play again');
    }

    // Returns the next id that is not in use by any room, starting from 1
    getRoomId() {
        let possibleId = 1;
        while (true) {
            // Check if the current id is available
            let used = false;
            for (let room of this.rooms) {
                if (room.id == possibleId) {
                    used = true;
                    break;
                }
            }
            // Return it if not in use in any room
            if (!used) {
                console.log('Assigning room id ' + possibleId);
                return possibleId;
            }
            // TRy with the next one
            possibleId++;
        }
    }
};
