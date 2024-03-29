// This file implements the server code for the game.

// Create a logger
const winston = require('winston');
const { combine, timestamp, printf } = winston.format;
const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
global.logger = winston.createLogger({
    level: 'debug',
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new winston.transports.File({ filename: 'server.log', level: 'debug' }),
        new winston.transports.Console()
    ]
});

// Create a master that handles the game logic server side.
let Master = require('./master.js');
let master = new Master();
logger.info('Master created');

// Create the server
let express = require('express');
let app = express();
// Select the port to listen to
let server = app.listen(8080);
// Select the folder to serve
app.use(express.static('public'));
logger.info('Server running');

// Load the socket.io module
let socket = require('socket.io');
global.io = socket(server);
logger.info('Sockets up');


// Handle new connections.
io.sockets.on('connection', (socket) => {
    logger.info('Accepting a new client with socket id ' + socket.id);

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
        logger.info('Client is leaving');
        master.leave(socket.id);
    });

    // Handle when a client wants to reset the current game
    socket.on('again', () => {
        master.again(socket.id);
    });

    // Handle disconnects
    socket.on('disconnect', () => {
        logger.info('Server has detected a disconnect');
        master.leave(socket.id);
    });
});
