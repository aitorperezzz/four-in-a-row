let Board = require('./board.js');

module.exports = class Room {
    constructor(socketIds) {
        this.playerIds = {};
        this.turn = undefined;
        this.playing = false;
        this.board = new Board();

        // Register the socket ids already provided
        socketIds.forEach(id => {
            console.log('id ' + id);
            this.register(id);
            console.log(typeof (id));
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
        if (this.getSocketIds().includes(socketId)) {
            delete this.playerIds[socketId];
            this.turn = undefined;
            this.playing = false;
            this.board.reset();

            // Tell the remaining client to wait
            this.send('wait');
        }
        else {
            console.log('Cannot unregister, as the client does not belong to this room');
        }
    }

    // Return true if the provided socket id is registered in this room
    isRegistered(socketId) {
        return this.getSocketIds().includes(socketId);
    }

    // Send a click to the room and process it.
    // Return true if the click was intended for this room
    clicked(data) {
        // Check the player belongs to this room
        var intendedForThisRoom = false;
        if (!this.isRegistered(data.socketId)) {
            console.log('Socket id is not registered in this room');
            console.log(this);
            return intendedForThisRoom;
        }
        intendedForThisRoom = true;

        // Check this room is playing
        if (!this.playing) {
            console.log('Ignoring click: room is not playing');
            return intendedForThisRoom;
        }

        // Check it's the correct turn
        let playerId = this.playerIds[data.socketId];
        if (this.turn != playerId) {
            console.log('Ignoring click: not the turn of this player');
            return intendedForThisRoom;
        }

        // Pass the click to the board, who will decide if there is an update or not
        let updateData = this.board.clicked(playerId, data.x, data.y);
        if (updateData) {
            this.send('addDisc', updateData);

            // Update the turn in master.
            this.turn = this.turn == 1 ? 2 : 1;
            this.send('updateTurn', { turn: this.turn });

            // Check for win
            let winnerData = this.board.checkWin();
            if (winnerData) {
                this.send('winner', winnerData);
            }
        }

        return intendedForThisRoom;
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