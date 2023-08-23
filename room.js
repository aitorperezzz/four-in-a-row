let Grid = require('./grid.js');

module.exports = class Room {
    constructor(socketIds) {
        this.playerIds = {};
        this.turn = undefined;
        this.playing = false;
        this.grid = new Grid();
        this.initialTurn = undefined;

        // Register the socket ids already provided
        socketIds.forEach(id => {
            this.register(id);
        });
    }


    // Return true if the room is full
    isFull() {
        return Object.keys(this.playerIds).length == 2;
    }

    // Register a new player in this room provided its socket id
    register(socketId) {
        console.log('Registering socket id ' + socketId);
        if (!this.isFull()) {
            // Decide the player id for this client
            let playerId = this.getAvailableId();
            // Add it to the dictionary
            this.playerIds[socketId] = playerId;
            console.log('Socket id ' + socketId + ' has been registered');

            // If the room is now full, it's a good time to decide a turn.
            // The turn will be random
            if (this.isFull()) {
                console.log('Room is full. Telling players to begin playing');
                this.turn = Math.random() < 0.5 ? 1 : 2;
                this.initialTurn = this.turn;
                this.playing = true;
                // Send a message to both players to start playing
                for (const [socketId, playerId] of Object.entries(this.playerIds)) {
                    io.to(socketId).emit('begin', { playerId: playerId, socketId: socketId, turn: this.turn });
                }
            }
            else {
                console.log('Telling the player to wait');
                io.to(socketId).emit('wait');
            }
            return true;
        }
        else {
            console.log('Cannot register player in this room because it\'s full');
            return false;
        }
    }

    // Remove a player from the room, provided its socket id
    unregister(socketId) {
        // Return early if the client does not belong to the room
        if (!this.isRegistered(socketId)) {
            console.log('Client does not belong to this room');
            return false;
        }

        // Remove the client from this room
        delete this.playerIds[socketId];
        this.turn = undefined;
        this.initialTurn = undefined;
        this.playing = false;
        this.grid.reset();

        // Tell the other client to wait
        this.send('wait');
        return true;
    }

    again(socketId) {
        // Return early if the client does not belong to the room
        if (!this.isRegistered(socketId)) {
            console.log('Client does not belong to this room');
            return false;
        }

        // Play again, so reset the grid and select the next turn
        this.turn = this.initialTurn == 1 ? 2 : 1;
        this.initialTurn = this.turn;
        this.grid.reset();
        this.send('again', { turn: this.turn });
    }

    // Return true if the provided socket id is registered in this room
    isRegistered(socketId) {
        return this.getSocketIds().includes(socketId);
    }

    // Send a click to the room and process it.
    // Return true if the click was intended for this room
    clicked(socketId, col) {
        // Return early if the client does not belong to the room
        if (!this.isRegistered(socketId)) {
            console.log('Client does not belong to this room');
            return false;
        }

        // Check this room is playing
        if (!this.playing) {
            console.log('Ignoring click: room is not playing');
            return true;
        }

        // Check it's the correct turn
        let playerId = this.playerIds[socketId];
        if (this.turn != playerId) {
            console.log('Ignoring click: not the turn of this player');
            return true;
        }

        // Pass the click to the grid, who will decide if there is an update or not
        let disc = this.grid.clicked(playerId, col);
        if (disc) {
            console.log('A disc update needs to be sent');
            this.send('addDisc', disc);

            // Update the turn in master.
            this.turn = this.turn == 1 ? 2 : 1;
            this.send('updateTurn', { turn: this.turn });

            // Check for win
            let winnerId = this.grid.checkWin();
            if (winnerId != null) {
                this.send('winner', { playerId: winnerId });
            }
        }

        return true;
    }

    // Return the list of socket ids in this room
    getSocketIds() {
        return Object.keys(this.playerIds);
    }

    // Send a message to all participants in this room
    send(command, data) {
        this.getSocketIds().forEach(function (socketId) {
            io.to(socketId).emit(command, data);
        });
    }

    // Assign an id that is available
    getAvailableId() {
        let playerIdsInUse = new Set(Object.values(this.playerIds));
        for (let id = 1; id <= 2; id++) {
            if (!playerIdsInUse.has(id)) {
                return id;
            }
        }
        return null;
    }
}