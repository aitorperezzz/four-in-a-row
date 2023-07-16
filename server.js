// This file implements the server code for the game.

// Create a master that handles the game logic server side.
let Master = require('./master.js');
let master = new Master();
console.log('Master created');

// Create the server
let express = require('express');
let app = express();
// Select the port to listen to
let server = app.listen(8080);
// Select the folder to serve
app.use(express.static('public'));
console.log('Server running');

// Load the socket.io module
let socket = require('socket.io');
global.io = socket(server);
console.log('Sockets up');


// Handle new connections.
io.sockets.on('connection', newClient);
function newClient(socket) {
    console.log('Accepting a new client with socket id ' + socket.id);
    io.to(socket.id).emit('initialize', master.clientData);

    // Handle when a client is ready to play the game
    socket.on('ready', ready);
    function ready(data) {
        master.ready(data);
    }

    // Handle when a client clicks on the canvas
    socket.on('clicked', clicked);
    function clicked(data) {
        master.clicked(data);
    }

    // Handle when a client wants to leave a room
    socket.on('leave', leave);
    function leave(data) {
        master.leave(data);
    }

    // Handle when a client wants to reset the current game
    // TODO
}
