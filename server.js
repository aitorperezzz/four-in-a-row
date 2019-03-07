// Server code for the game.
"use strict";

// CREATE THE SERVER.
console.log('Creating the server...');
// Load the express module.
let express = require('express');

// Create the app by executing the express function.
let app = express();

// Select a port to serve the content.
let server = app.listen(8080);

// Select the folder to serve the content.
// This folder is public and static.
app.use(express.static('public'));
console.log('Server is running!');

// SOCKETS.
// Load the socket.io module.
let socket = require('socket.io');

// Create input output functionality for the server we initialized earlier.
let io = socket(server);

// Create the master that will control all the application, server side.



// SERVER CODE.

// Handle new connections.
io.sockets.on('connection', newClient);

function newClient(socket) {
  console.log('Accepting a new client with id: ' + socket.id);

  // Handle a 'clicked' message coming from this client.
  socket.on('clicked', clicked);
  function clicked(data) {
    // Log the information received.
    console.log(data);

    // Send this information to the other clients.
    socket.broadcast.emit('clickedByOthers', data);
  }

  // Handle when the client is ready to play the game.
  socket.on('ready', ready);
  function ready(data) {
    // A client is ready to play the game.
    console.log('Client wants to play');
    master.ready(socket.id);
  }
}

class Master {
  // This is the master in the server, responsible for the whole application.

  constructor() {
    this.numPlayers = 0;
    this.mode = 'waiting';
    this.players = [];

    // Create the grid of discs.
    this.grid = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 7; j++) {
        let disc = {
          row: i,
          column: j,
          player: 'none'
        }
        this.grid.push(disc);
      }
    }
  }

  ready(id) {
    // A client wants to play. This function receives a socket id.
    let player;

    switch (this.numPlayers) {
      case 0:
        // Accept the client and create its profile as Player 1.
        console.log('Client is accepted as Player 1');
        player = {
          idPlayer: 1,
          idSocket: id
        }
        // Update master variables.
        this.players.push(player);
        this.numPlayers++;

        // Inform the players about this new player.
        io.sockets.emit('setPlayer', player);
        console.log('Player: ' + player.idPlayer + ', Id: ' + player.idSocket);
        break;
      case 1:
        // Accept the client and create its profile as Player 2.
        console.log('Client is accepted as Player 2');
        player = {
          idPlayer: 2,
          idSocket: id
        }
        // Update master variables.
        this.players.push(player);
        this.numPlayers++;

        // Inform the players about this new player.
        io.sockets.emit('setPlayer', player);
        console.log('Player: ' + player.idPlayer + ', Id: ' + player.idSocket);

        // The room is full so get into play mode and inform.
        io.sockets.emit('beginGame', this.grid);
        this.mode = 'playing';
        break;
      default:
        // Don't accept the player.
        console.log('Client is not accepted. The room is full');
        break;
    }
  }
}
let master = new Master();
