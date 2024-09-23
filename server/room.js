let Grid = require('./grid.js');
let PlayerInfo = require('./playerInfo.js');

module.exports = class Room {
    constructor(id, socketIds) {
        this.playersInfo = {};
        this.turn = undefined;
        this.playing = false;
        this.grid = new Grid();
        this.initialTurn = undefined;
        this.id = id;

        // Register the socket ids already provided
        socketIds.forEach(id => {
            this.register(id);
        });
    }

    // Return true if the room is full
    isFull() {
        return Object.keys(this.playersInfo).length == 2;
    }

    // Register a new player in this room provided its socket id
    register(socketId) {
        logger.debug('Trying to register socket id ' + socketId + ' in room ' + this.id);
        if (!this.isFull()) {
            // Decide the player id for this client
            let playerId = this.getAvailableId();
            // Add it to the dictionary
            this.playersInfo[socketId] = new PlayerInfo(playerId);
            logger.info('Socket id ' + socketId + ' has been registered in room ' + this.id);

            // If the room is now full, it's a good time to decide a turn.
            // The turn will be random
            if (this.isFull()) {
                logger.info('Room ' + this.id + ' is full. Telling players to begin playing');
                this.turn = Math.random() < 0.5 ? 1 : 2;
                this.initialTurn = this.turn;
                this.playing = true;
                // Send a message to both players to start playing
                this.getSocketIds().forEach(socketId => {
                    io.to(socketId).emit('begin', {
                        playerId: this.playersInfo[socketId].getPlayerId(),
                        socketId: socketId,
                        turn: this.turn,
                        roomId: this.id
                    });
                });
            }
            else {
                logger.info('Telling the player to wait');
                io.to(socketId).emit('wait');
            }
            return true;
        }
        else {
            logger.debug('Cannot register client in room ' + this.id + ' because it is full');
            return false;
        }
    }

    // Remove a player from the room, provided its socket id
    unregister(socketId) {
        // Return early if the client does not belong to the room
        if (!this.isRegistered(socketId)) {
            logger.debug('Client ' + socketId + ' does not belong to room ' + this.id);
            return false;
        }

        // The room has to dissolve, so inform the other player
        logger.info('Room ' + this.id + ' is dissolving');
        for (let playerSocketId of this.getSocketIds()) {
            if (playerSocketId != socketId) {
                // This is the other player
                logger.info('Informing player ' + socketId + ' that the room has dissolved')
                io.to(playerSocketId).emit('leave');
            }
        }

        // Let the master know the message was intended for this room
        return true;
    }

    again(socketId) {
        // Return early if the client does not belong to the room
        if (!this.isRegistered(socketId)) {
            logger.debug('Client ' + socketId + ' does not belong to room ' + this.id);
            return false;
        }

        // Play again, so reset the grid and select the next turn
        this.turn = this.initialTurn == 1 ? 2 : 1;
        this.initialTurn = this.turn;
        this.grid.reset();
        this.send('again', { turn: this.turn });
        return true;
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
            logger.debug('Client ' + socketId + ' does not belong to room ' + this.id);
            return false;
        }

        // Check this room is playing
        if (!this.playing) {
            logger.debug('Ignoring click: room is not playing');
            return true;
        }

        // Check it's the correct turn
        let playerId = this.playersInfo[socketId].getPlayerId();
        if (this.turn != playerId) {
            logger.debug('Ignoring click: not the turn of this player');
            return true;
        }

        // Pass the click to the grid, who will decide if there is an update or not
        let disc = this.grid.clicked(playerId, col);
        if (disc) {
            logger.info('A disc update needs to be sent in room ' + this.id);
            this.send('addDisc', disc);

            // Update the turn in master.
            this.turn = this.turn == 1 ? 2 : 1;
            this.send('updateTurn', { turn: this.turn });

            // Check for win
            let winnerId = this.grid.checkWin();
            if (winnerId != null) {
                logger.info('Player ' + winnerId + ' has won in room ' + this.id);
                let winnerSocketId = this.getSocketId(winnerId);
                this.playersInfo[winnerSocketId].addGameWon();
                this.getSocketIds().forEach(socketId => {
                    this.playersInfo[socketId].addGamePlayed();
                    io.to(socketId).emit('winner', {
                        playerId: winnerId,
                        gamesWon: this.playersInfo[socketId].getGamesWon(),
                        gamesPlayed: this.playersInfo[socketId].getGamesPlayed()
                    });
                });
            }
        }

        return true;
    }

    // Return the list of socket ids in this room
    getSocketIds() {
        return Object.keys(this.playersInfo);
    }

    // Return the socket id of the provided player id
    // Return null if there is none
    getSocketId(playerId) {
        for (let socketId of this.getSocketIds()) {
            if (this.playersInfo[socketId].getPlayerId() == playerId) {
                return socketId;
            }
        }
        return null;
    }

    // Send a message to all participants in this room
    send(command, data) {
        this.getSocketIds().forEach(function (socketId) {
            io.to(socketId).emit(command, data);
        });
    }

    // Assign an id that is available
    getAvailableId() {
        let playerIdsInUse = [];
        this.getSocketIds().forEach(socketId => {
            playerIdsInUse.push(this.playersInfo[socketId].getPlayerId());
        });
        for (let id = 1; id <= 2; id++) {
            if (!playerIdsInUse.includes(id)) {
                return id;
            }
        }
        return null;
    }
}