module.exports = class Grid {
    constructor() {
        // Create an empty grid
        this.discs = [];
        for (let j = 0; j < 7; j++) {
            this.discs.push([]);
            for (let i = 0; i < 6; i++) {
                this.discs[j].push(0);
            }
        }
    }

    // Return the new disc object to send to the clients if the click on the specified column was valid.
    // If not, return null
    clicked(playerId, col) {
        logger.debug('Player ' + playerId + ' clicked on column ' + col);
        let row = this.getNextRow(col);
        if (row != null) {
            this.discs[col][row] = playerId;
            return { playerId: playerId, col: col, row: row };
        }
        else {
            logger.debug('Column clicked is full');
            return null;
        }
    }

    // Receive a column index and return the row where the next disc would be placed.
    // Return null if there is no space left in the column
    getNextRow(col) {
        for (let i = 0; i < 6; i++) {
            if (this.discs[col][i] == 0) {
                return i;
            }
        }
        return null;
    }

    // Check if any of the players has won.
    // In that case, return the id of the winner
    checkWin() {
        for (let j = 0; j < 7; j++) {
            for (let i = 0; i < 6; i++) {
                if (this.discs[j][i] != 0) {
                    // Call recursive win on this piece.
                    let win = this.recursiveWin(j, i, this.discs[j][i], 0, 0, 0);
                    if (win) {
                        let winnerId = this.discs[j][i];
                        return winnerId;
                    }
                }
            }
        }
        return null;
    }

    recursiveWin(col, row, playerId, step, relcol, relrow) {
        let win = false;
        for (let j = -1; j < 2; j++) {
            for (let i = -1; i < 2; i++) {
                if (!(i == 0 && j == 0)) {
                    // The disc is not the same one calling this function.
                    if (this.accessible(col + j, row + i)) {
                        // The disc has an accessible index.
                        if (this.discs[col + j][row + i] == playerId) {
                            // There is a disc and belongs to the player.
                            if (step == 0) {
                                // Initiate the recursive process.
                                win = this.recursiveWin(col + j, row + i, playerId, step + 1, j, i);
                            }
                            else if (step == 3) {
                                // Reached the end of the algorithm.
                                return true;
                            }
                            else {
                                // Some further step in the algorithm: check relative position.
                                if (j == relcol && i == relrow) {
                                    // Call algorithm recursively.
                                    return this.recursiveWin(col + j, row + i, playerId, step + 1, j, i);
                                }
                            }
                        }
                    }
                }
            }
        }
        return win;
    }

    // Receive a row and a column and decide if it is accesible.
    accessible(col, row) {
        let colacc = 0 <= col && col <= 6;
        let rowacc = 0 <= row && row <= 5;
        return colacc && rowacc;
    }

    // Set all the grid of discs to their initial values.
    reset() {
        logger.info('Resetting grid');
        for (let j = 0; j < 7; j++) {
            for (let i = 0; i < 6; i++) {
                this.discs[j][i] = 0;
            }
        }
    }
}