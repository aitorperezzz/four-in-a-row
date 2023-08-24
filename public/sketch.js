// Declare the socket variables.
let socket;
let socketId;

// Declare an object to store lengths.
let sizes = {};

// Declare some global variables for the game logic.
let mode = undefined;
let discs = [];
let playerId = undefined;
let turn = undefined;
let colors = undefined;
let winnerId = undefined;
let gamesWon = 0;
let gamesPlayed = 0;
let roomId = undefined;

// Objects inside the canvas
let message = undefined;
let submessage = undefined;
let buttonManager = undefined;

document.addEventListener('DOMContentLoaded', () => {
    // Connect the socket to the server
    socket = io();

    // This client is connected to the server
    socket.on('connect', () => {
        console.log('Client connected with socket id ' + socket.id);
        socketId = socket.id.slice();
    });

    // The server tells me to wait because I have entered an empty room
    socket.on('wait', () => {
        mode = 'wait';
        buttonManager.clear();
        buttonManager.append('leave');
        resetRoom();
    });

    // My room has been dissolved 
    // (my partner has either left or disconnected)
    socket.on('leave', () => {
        goToInit();
    });

    // The game starts, I will find here my id and the current turn
    socket.on('begin', (data) => {
        playerId = data.playerId;
        turn = data.turn;
        roomId = data.roomId;
        console.log('Game begins. I am player ' + playerId + ' and the turn is ' + turn);
        mode = 'play';
        buttonManager.clear();
        buttonManager.append('leave');
    });

    // The server updates the current turn
    socket.on('updateTurn', (data) => {
        console.log('Server updates the turn');
        turn = data.turn;
    });

    // The server has sent a new disc
    socket.on('addDisc', (data) => {
        // Compute the real x and y positions of the disc
        console.log('Adding disc sent by the server');
        let coordinates = computeDiscCoordinates(data.col, data.row);
        discs.push({
            playerId: data.playerId,
            x: coordinates.x,
            y: coordinates.y,
            col: data.col,
            row: data.row
        });
    });

    // Server indicates there is a winner
    socket.on('winner', (data) => {
        console.log('Player ' + data.playerId + ' is the winner');
        winnerId = data.playerId;
        mode = 'winner';
        gamesWon = data.gamesWon;
        gamesPlayed = data.gamesPlayed;
        // Add the play again button
        buttonManager.append('again');
    });

    // Server tells me to play again, with the same partner
    socket.on('again', (data) => {
        console.log('Play again');
        turn = data.turn;
        discs = [];
        winnerId = undefined;
        mode = 'play';
        // Remove the play again button
        buttonManager.remove('again');
    });

    // Attempt to send a message to the server before leaving
    socket.on('disconnect', () => {
        socket.emit('leave');
    });

    // Create the button manager and register some buttons
    buttonManager = new ButtonManager();
    buttonManager.register('ready', 'Play', readyHandler);
    buttonManager.register('leave', 'Leave room', leaveHandler);
    buttonManager.register('again', 'Play again', againHandler);

});


// Provided the col and row of a disc, returns the x and y coordinates
// that correspond with the current global sizes
function computeDiscCoordinates(col, row) {
    let xpos = sizes.initialx + sizes.size / 2 + col * sizes.size;
    let ypos = sizes.initialy + sizes.ysize - sizes.size / 2 - row * sizes.size;
    return { x: xpos, y: ypos };
}

// Makes the complete global sizes computation
function computeSizes() {
    // x dimension (horizontal) is 4/5 of the y dimension (vertical)
    let canvasRatio = 4 / 5;
    let screenProportion = 0.8;
    let boardProportion = 0.2;
    let gridxDimension = 7;
    let gridyDimension = 6;
    let gridRatio = gridxDimension / gridyDimension;
    let gridProportion = 0.8;

    // Compute the sizes of the p5js grid
    if (windowHeight * canvasRatio < windowWidth) {
        // Decide according to vertical space
        sizes.canvasy = screenProportion * windowHeight;
        sizes.canvasx = sizes.canvasy * canvasRatio;
    }
    else {
        // Decide according to horizontal space
        sizes.canvasx = screenProportion * windowWidth;
        sizes.canvasy = sizes.canvasx / canvasRatio;
    }

    // Text size
    sizes.textsize = sizes.canvasy * 0.045;
    sizes.subtextsize = sizes.canvasy * 0.035;

    // Board size
    sizes.boardsize = sizes.canvasy * boardProportion;

    // Compute the sizes of the grid itself
    if ((sizes.canvasy - sizes.boardsize) * gridRatio < sizes.canvasx) {
        // Decide according to vertical space
        sizes.ysize = gridProportion * (sizes.canvasy - sizes.boardsize);
        sizes.xsize = sizes.ysize * gridRatio;
    }
    else {
        // Decide according to horizontal space
        sizes.xsize = gridProportion * sizes.canvasx;
        sizes.ysize = sizes.xsize / gridRatio;
    }
    sizes.size = sizes.xsize / gridxDimension;

    // Initial positions of the lines
    sizes.initialx = (sizes.canvasx - sizes.xsize) / 2;
    sizes.initialy = sizes.boardsize + (sizes.canvasy - sizes.boardsize - sizes.ysize) / 2;

    // To place things on the message board
    sizes.boardx = sizes.canvasx / 2;
    sizes.boardytop = sizes.boardsize / 4;
    sizes.boardybot = sizes.boardsize * 3 / 4;
    sizes.rad = sizes.size * 3 / 4;
}

function setup() {

    // Make a first computation of the global sizes and create a canvas
    computeSizes();
    let canvas = createCanvas(sizes.canvasx, sizes.canvasy);
    canvas.parent('sketch-holder');

    // Create the messages
    message = new Message();
    submessage = new Message();
    message.resize(sizes.boardx, sizes.boardytop, sizes.textsize);
    submessage.resize(sizes.boardx, sizes.boardybot, sizes.subtextsize);

    // Create the colors array.
    colors = { 1: color(255, 0, 0), 2: color(255, 255, 102) };

    // Init mode
    mode = 'init';
}

function draw() {
    // Draw a background.
    background('#36454F');

    if (mode == 'play' || mode == 'winner') {
        // Draw the vertical lines.
        strokeWeight(2);
        stroke(255);
        for (let i = 0; i < 8; i++) {
            stroke(255);
            line(sizes.initialx + i * sizes.size, sizes.initialy, sizes.initialx + i * sizes.size, sizes.initialy + sizes.ysize);
        }

        // Draw the bottom line.
        line(sizes.initialx, sizes.initialy + sizes.ysize, sizes.initialx + sizes.xsize, sizes.initialy + sizes.ysize);

        // Draw the discs.
        for (let k = 0; k < discs.length; k++) {
            fill(colors[discs[k].playerId]);
            noStroke();
            ellipse(discs[k].x, discs[k].y, sizes.rad, sizes.rad);
        }
    }

    // Display the messages
    displayMessages();
}

function windowResized() {
    // Compute new global sizes
    computeSizes();
    // Canvas
    resizeCanvas(sizes.canvasx, sizes.canvasy);
    // Messages
    message.resize(sizes.boardx, sizes.boardytop, sizes.textsize);
    submessage.resize(sizes.boardx, sizes.boardybot, sizes.subtextsize);
    // Discs
    discs.forEach(disc => {
        let newCoordinates = computeDiscCoordinates(disc.col, disc.row);
        disc.x = newCoordinates.x;
        disc.y = newCoordinates.y;
    });
}

// The room gets reset
function resetRoom() {
    discs = [];
    playerId = undefined;
    turn = undefined;
    winnerId = undefined;
    gamesWon = 0;
    gamesPlayed = 0;
    roomId = undefined;
}

function goToInit() {
    mode = 'init';
    buttonManager.clear();
    buttonManager.append('ready');
    resetRoom();
}

// Returns true if this is the turn of the client
function isMyTurn() {
    return playerId == turn;
}


function mousePressed() {
    // Only if it's my turn
    if (!isMyTurn()) {
        console.log('Ignoring click: not my turn');
        return;
    }

    // Only if playing
    if (mode != 'play') {
        console.log('Ignoring click: not playing');
        return;
    }

    // Only if it's inside the canvas
    let col = getColumn(mouseX, mouseY);
    if (col == null) {
        console.log('Ignoring click: outside the grid');
        return;
    }

    socket.emit('clicked', { col: col });
}

function getColumn(mx, my) {
    // Decide if the click is inside the grid itself
    let xtrue = sizes.initialx < mx && mx < sizes.initialx + 7 * sizes.size;
    let ytrue = sizes.initialy < my && my < sizes.initialy + 6 * sizes.size;
    if (!xtrue || !ytrue) {
        console.log('Click outside the grid');
        return null;
    }

    // Go through all the columns
    for (let i = 0; i < 7; i++) {
        if (sizes.initialx + i * sizes.size < mx && mx < sizes.initialx + (i + 1) * sizes.size) {
            console.log('Click on column ' + i);
            return i;
        }
    }
    console.log('Error: click inside the grid but not in a specific column');
    return null;
}

function displayMessages() {
    // Update the messages if necessary
    switch (mode) {
        case 'init':
            message.setText('Press play to enter a room and play');
            submessage.setText(undefined);
            break;
        case 'wait':
            message.setText('Waiting for another player...');
            submessage.setText(undefined);
            break;
        case 'play':
            message.setText(isMyTurn() ? 'Playing. Your turn' :
                'Playing. Turn of player ' + turn);
            submessage.setColor(colors[playerId]);
            submessage.setText(createSubmessage());
            break;
        case 'winner':
            message.setText(playerId == winnerId ? 'You are the winner!' :
                'Player ' + winnerId + ' is the winner!');
            submessage.setColor(colors[playerId]);
            submessage.setText(createSubmessage());
            break;
    }

    // Display the messages
    message.draw();
    submessage.draw();
}

function createSubmessage() {
    return 'You are player ' + playerId + ' (' + gamesWon + '/' + gamesPlayed + ')' +
        ' [Room ' + roomId + ']';
}

// Functions for buttons

function readyHandler() {
    // This function is triggered with the ready button
    console.log('I want to play');
    socket.emit('ready');
}

function againHandler() {
    // Function triggered with the play again button
    console.log('I want to play again');
    socket.emit('again');
}

function leaveHandler() {
    // Function triggered with the leave button
    console.log('I want to leave the room');
    socket.emit('leave');
    goToInit();
}
