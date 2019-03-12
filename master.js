// This file defines the Master class that controls the game logic.

// Import the server file to communicate with it.
let server = require('./server.js');

// Define the master class and export it to the server file.
module.exports = class Master {
  constructor() {
    // Variables for the game logic.
    this.numPlayers = 0;
    this.mode = 'waiting';
    this.players = [];
    this.turn = 1;

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

    // Create the grid of discs.
    this.discs = [];
    for (let j = 0; j < 7; j++) {
      this.discs.push([]);
      for (let i = 0; i < 6; i++) {
        let disc = {
          idPlayer: 0
        };
        this.discs[j].push(disc);
      }
    }
  }

  ready(data) {
    // A client wants to play and sends its idSocket.
    console.log('A client clicked ready');
    let player;

    switch (this.numPlayers) {
      case 0:
        // Accept the client and create its profile as Player 1.
        console.log('Client is accepted as Player 1');
        player = {
          idPlayer: 1,
          idSocket: data.idSocket
        };
        // Update master variables.
        this.players.push(player);
        this.numPlayers++;

        // Inform the clients about this new player.
        server.send('addPlayer', player);
        break;
      case 1:
        // Accept the client and create its profile as Player 2.
        console.log('Client is accepted as Player 2');
        player = {
          idPlayer: 2,
          idSocket: data.idSocket
        };
        // Update master variables.
        this.players.push(player);
        this.numPlayers++;

        // Inform the clients about this new player.
        server.send('addPlayer', player);

        // The room is full so get into play mode and inform.
        let send = {
          mode: 'playing'
        };
        server.send('updateMode', send);
        this.mode = 'playing';
        break;
      default:
        // Don't accept the client.
        console.log('Client is not accepted. The room is full');
        break;
    }
  }

  clicked(data) {
    // A client has sent a click.
    console.log('Receiving a click from client '+ data.idSocket);
    console.log(data);

    // Check that we are in playing mode.
    if (this.mode != 'playing') {
      console.log('Not in play mode. Ignoring');
      return;
    }

    // Check that the client is a player.
    let idPlayer = this.isPlayer(data.idSocket);
    if (idPlayer == 0) {
      console.log('Client is not a player. Ignoring');
      return;
    }

    // Check if it's this player's turn.
    if (this.turn != idPlayer) {
      console.log('Not the turn of this player. Ignoring');
      return;
    }

    // Check that the click was inside the grid.
    if (!this.clickInside(data.x, data.y)) {
      console.log('The click was outside the grid. Ignoring');
      return;
    }

    // Only now add a disc.
    for (let j = 0; j < 7; j++) {
      if (this.initialx + j * this.size <= data.x && data.x < this.initialx + (j + 1) * this.size) {
        // Client has clicked on the j-th column. Add a disc to that column if possible.
        console.log('Player ' + idPlayer + ' clicked on column ' + j);
        let row = this.getNextRow(j);
        if (row < 6) {
          // Update the disc in master.
          this.discs[j][row].idPlayer = idPlayer;
          let data = this.bundleDisc(idPlayer, j, row);
          server.send('addDisc', data);

          // Check for win.
          console.log('******************* checking for win');
          this.checkWin();

          // Update the turn in master.
          this.turn = idPlayer == 1 ? 2 : 1;
        }
      }
    }
  }

  isPlayer(idSocket) {
    // Receives an idSocket and decides if the client is a player.
    for (let k = 0; k < this.players.length; k++) {
      if (this.players[k].idSocket == idSocket) {
        // It is a player.
        return this.players[k].idPlayer;
      }
    }
    return 0;
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
      if (this.discs[col][i].idPlayer == 0) {
        // This row is available for a disc.
        return i;
      }
    }
    // The column is full so return 6 (code for impossible).
    return 6;
  }

  bundleDisc(idPlayer, col, row) {
    // Receives information and returns a disc object as expected by the client.
    let x = this.discx + col * this.size;
    let y = this.discy - row * this.size;
    return {
      idPlayer: idPlayer,
      x: x,
      y: y,
    };
  }

  checkWin() {
    // Checks if any of the players has won.
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < 6; i++) {
        if (this.discs[j][i].idPlayer != 0) {
          // Call recursive win on this piece.
          let win = this.recursiveWin(j, i, this.discs[j][i].idPlayer, 0, 0, 0);
          if (win) {
            // Update master variables.
            this.mode = 'winner';
            this.winner = this.discs[j][i].idPlayer;
            console.log('Player ' + this.winner + ' has won');

            // Inform the clients.
            let data = {
              idPlayer: this.winner
            };
            server.send('winner', data);
          }
        }
      }
    }
  }

  recursiveWin(col, row, idPlayer, step, relcol, relrow) {
    console.log('calling recursive win, step '+step+' on col='+col+' row='+row+' with relcol='+relcol+' relrow='+relrow);
    let win = false;
    for (let j = -1; j < 2; j++) {
      for (let i = -1; i < 2; i++) {
        if (!(i == 0 && j == 0)) {
          // The disc is not the same one calling this function.
          if (this.accessible(col + j, row + i)) {
            // The disc has an accessible index.
            if (this.discs[col + j][row + i].idPlayer == idPlayer) {
              // There is a disc and belongs to the player.
              if (step == 0) {
                // Initiate the recursive process.
                win = this.recursiveWin(col + j, row + i, idPlayer, step + 1, j, i);
              }
              else if (step == 3) {
                // Reached the end of the algorithm.
                return true;
              }
              else {
                // Some further step in the algorithm: check relative position.
                if (j == relcol && i == relrow) {
                  // Call algorithm recursively.
                  return this.recursiveWin(col + j, row + i, idPlayer, step + 1, j, i);
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

  leave(data) {
    // A client has clicked the leave button.
    console.log('A client clicked leave');

    // Check if we are in playing mode.
    if (this.mode == 'waiting') {
      console.log('Cannot leave when waiting. Ignoring');
      return;
    }

    // Check if the client is a player.
    let idPlayer = this.isPlayer(data.idSocket);
    if (idPlayer == 0) {
      console.log('Client is not a player. Ignoring');
      return;
    }

    // Only now get the player to leave the room.
    this.players = [];
    this.numPlayers = 0;
    this.turn = 1;
    this.mode = 'waiting';
    this.resetDiscs();
    let send = {
      mode: 'waiting'
    }
    server.send('updateMode', send);
  }

  resetDiscs() {
    // Sets all the grid of discs to their initial values.
    console.log('Resetting grid');
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < 6; i++) {
        this.discs[j][i].idPlayer = 0;
      }
    }
  }
};
