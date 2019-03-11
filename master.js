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

    // Decide the size of the canvas.
    this.canvasx = 400;
    this.canvasy = 500;

    // Calculate relevant positions for the game.
    this.xsize = Math.min(this.canvasx, this.canvasy - 100) * 6 / 7;
    this.size = this.xsize / 7;
    this.ysize = this.size * 6;

    // Calculate initial positions for the grid.
    this.initialx = (this.canvasx - this.xsize) / 2;
    this.initialy = 100 + (this.canvasy - 100 - this.ysize) / 2;

    // Calculate starting positions for the discs.
    this.discx = this.initialx + this.size / 2;
    this.discy = this.initialy + this.ysize - this.size / 2;

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
    console.log('entering ready data');
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
        server.send('beginGame', 0);
        this.mode = 'playing';
        break;
      default:
        // Don't accept the client.
        console.log('Client is not accepted. The room is full');
        break;
    }
  }

  isPlayer(idSocket) {
    // Receives an idSocket and decides if it is a player.
    for (let k = 0; k < this.players.length; k++) {
      if (this.players[k].idSocket == idSocket) {
        // It is a player.
        return true;
      }
    }
    return false;
  }

  clicked(data) {
    // The client has sent a click.
    console.log('Receiving a click from client '+ data.idSocket);
    console.log(data);

    // Check that the client is a player.
    let found = false;
    let idPlayer;
    for (let k = 0; k < this.players.length; k++) {
      if (this.players[k].idSocket == data.idSocket) {
        // The client is a player.
        idPlayer = this.players[k].idPlayer;
        found = true;
      }
    }
    if (!found) {
      console.log('The client is not a player, so ignore');
      return;
    }

    // Check that the click was inside the canvas.
    if (data.x < 0 || data.x > this.canvasx || data.y < 0 || data.y > this.canvasy) {
      console.log('The click came from outside the canvas. Ignoring.');
      return;
    }

    if (this.mode == 'playing' && this.isPlayer(data.idSocket)) {
      console.log('entering');
      for (let j = 0; j < 7; j++) {
        if (this.initialx + j * this.size <= data.x && data.x < this.initialx + (j + 1) * this.size) {
          // Client has clicked on the j-th column. Add a disc to that column.
          console.log('player clicked the '+j+' column');
          let row = this.getNextRow(j);
          if (row < 6) {
            // Modify that disc and send the information.
            this.discs[j][row].idPlayer = idPlayer;
            let data = this.bundleDisc(j, row, idPlayer);
            console.log(data);
            server.send('addDisc', data);
          }
        }
      }
    }
  }

  getNextRow(col) {
    // Receives a column number and returns the row to place the next disc.
    for (let i = 0; i < 6; i++) {
      if (this.discs[col][i].idPlayer == 0) {
        // This row is available for a disc.
        console.log('i = '+i);
        return i;
      }
    }

    // The column is full so return 6 (code for impossible).
    return 6;
  }

  bundleDisc(col, row, idPlayer) {
    // Receives information and returns a disc object as expected by the client.
    let x = this.discx + col * this.size;
    let y = this.discy - row * this.size;
    return {
      x: x,
      y: y,
      idPlayer: idPlayer
    };
  }
};
