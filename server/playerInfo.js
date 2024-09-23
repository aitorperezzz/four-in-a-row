module.exports = class PlayerInfo {
    constructor(playerId) {
        this.playerId = playerId;
        this.gamesWon = 0;
        this.gamesPlayed = 0;
    }

    addGameWon() {
        this.gamesWon++;
    }

    addGamePlayed() {
        this.gamesPlayed++;
    }

    getGamesWon() {
        return this.gamesWon;
    }

    getGamesPlayed() {
        return this.gamesPlayed;
    }

    getPlayerId() {
        return this.playerId;
    }

    reset() {
        this.gamesWon = 0;
        this.gamesPlayed = 0;
    }
}