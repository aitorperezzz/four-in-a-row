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
io.sockets.on('connection', (socket) => {
    console.log('Accepting a new client with socket id ' + socket.id);

    // Handle when a client is ready to play the game
    socket.on('ready', () => {
        master.ready(socket.id);
    });

    // Handle when a client clicks on the canvas
    socket.on('clicked', (data) => {
        master.clicked(socket.id, data.col);
    });

    // Handle when a client wants to leave a room
    socket.on('leave', () => {
        console.log('Client is leaving');
        master.leave(socket.id);
    });

    // Handle when a client wants to reset the current game
    socket.on('again', () => {
        master.again(socket.id);
    });

    // Handle when a client wants to reset the current game
    socket.on('disconnect', () => {
        console.log('Server has detected a disconnection');
        master.leave(socket.id);
    });
});
