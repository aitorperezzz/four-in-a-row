// This file implements the server code for the game.

// Import the Master class to use it here.
let Master = require('./master.js');
// Initialize a master.
let master = new Master();
console.log('Master created');

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

// Create input output functionality for the server.
let io = socket(server);


// SERVER CODE.

// Handle new connections.
io.sockets.on('connection', newClient);
function newClient(socket) {
  console.log('Accepting a new client with socket id: ' + socket.id);
  io.emit('initialize', master.clientData);

  // Handle when a client is ready to play the game.
  socket.on('ready', ready);
  function ready(data) {
    master.ready(data);
  }

  // Handle a click by a client on the canvas.
  socket.on('clicked', clicked);
  function clicked(data) {
    master.clicked(data);
  }

  // Handle a click on the leave button.
  socket.on('leave', leave);
  function leave(data) {
    master.leave(data);
  }
}

// This function is called by master to send information to clients.
function send(command, data) {
  console.log('Master: sending ' + command + ' information');
  io.emit(command, data);
}
// Export this function for the Master class to use.
module.exports.send = send;
