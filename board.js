

module.exports = class Board {
    constructor() {
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

        // Create the grid of discs.
        this.discs = [];
        for (let j = 0; j < 7; j++) {
            this.discs.push([]);
            for (let i = 0; i < 6; i++) {
                this.discs[j].push(0);
            }
        }
    }

    // Handle the click on the board, and return true if the click was valid
    clicked(playerId, x, y) {
        // Check that the click was inside the grid.
        if (!this.clickInside(x, y)) {
            console.log('Ignoring click: outside the grid');
            return null;
        }

        // Iterate over columns
        for (let j = 0; j < 7; j++) {
            if (this.initialx + j * this.size <= x && x < this.initialx + (j + 1) * this.size) {
                // Client has clicked on the j-th column. Add a disc to that column if possible.
                console.log('Player ' + playerId + ' clicked on column ' + j);
                let row = this.getNextRow(j);
                if (row < 6) {
                    // Update the disc here
                    this.discs[j][row] = playerId;
                    return this.bundleDisc(playerId, j, row);
                }
                else {
                    console.log('Column clicked is full');
                    return null;
                }
            }
        }
    }

    clickInside(x, y) {
        // Decides if the mouse click was inside the grid.
        let xtrue = this.initialx < x && x < this.initialx + this.xsize;
        let ytrue = this.initialy < y && y < this.initialy + this.ysize;
        return xtrue && ytrue;
    }

    getNextRow(col) {
        // Receives a column number and returns the row to place the next disc.
        for (let i = 0; i < 6; i++) {
            if (this.discs[col][i] == 0) {
                // This row is available for a disc.
                return i;
            }
        }
        // The column is full so return 6 (code for impossible).
        return 6;
    }

    bundleDisc(playerId, col, row) {
        // Receives information and returns a disc object as expected by the client.
        let x = this.discx + col * this.size;
        let y = this.discy - row * this.size;
        return {
            playerId: playerId,
            x: x,
            y: y,
        };
    }

    checkWin() {
        // Checks if any of the players has won.
        for (let j = 0; j < 7; j++) {
            for (let i = 0; i < 6; i++) {
                if (this.discs[j][i] != 0) {
                    // Call recursive win on this piece.
                    let win = this.recursiveWin(j, i, this.discs[j][i], 0, 0, 0);
                    if (win) {
                        // Update master variables.
                        this.mode = 'winner';
                        this.winner = this.discs[j][i];
                        console.log('Player ' + this.winner + ' has won');

                        // Inform the clients.
                        let data = {
                            playerId: this.winner
                        };
                        return data;
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

    accessible(col, row) {
        // receives a row and a column and decides if it is accesible.
        let colacc = 0 <= col && col <= 6;
        let rowacc = 0 <= row && row <= 5;
        return colacc && rowacc;
    }

    reset() {
        // Sets all the grid of discs to their initial values.
        console.log('Resetting grid');
        for (let j = 0; j < 7; j++) {
            for (let i = 0; i < 6; i++) {
                this.discs[j][i] = 0;
            }
        }
    }
}