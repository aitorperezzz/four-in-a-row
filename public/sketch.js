// Declare the socket variables.
let socket;
let socketId;
let initialized = false;

// Declare an object to store lengths.
let sizes = {};

// Declare some global variables for the game logic.
let mode = undefined;
let discs = [];
let playerId = undefined;
let turn = undefined;
let colors = undefined;
let winnerId = undefined;

let buttonManager = undefined;

function setup() {
    // Connect the socket to the server.
    socket = io();

    // Create the button manager and register some buttons
    buttonManager = new ButtonManager();
    buttonManager.register('ready', 'Play', readyHandler);
    buttonManager.register('leave', 'Leave room', leaveHandler);
    buttonManager.register('reset', 'Reset game', resetHandler);

    // Create the colors array.
    colors = [color(255, 0, 0), color(255, 255, 102)];

    // Declare the functions that will handle the different events.
    socket.on('connect', connect);
    socket.on('initialize', initialize);
    socket.on('wait', wait);
    socket.on('begin', begin);
    socket.on('updateTurn', updateTurn);
    socket.on('addDisc', addDisc);
    socket.on('winner', winner);
    socket.on('leave', leave);
}

function draw() {
    // Draw a background.
    background(0);

    if (initialized) {
        if (mode == 'play' || mode == 'winner') {
            // Draw the vertical lines.
            strokeWeight(2);
            for (let i = 0; i < 8; i++) {
                stroke(255);
                line(sizes.initialx + i * sizes.size, sizes.initialy, sizes.initialx + i * sizes.size, sizes.initialy + sizes.ysize);
            }

            // Draw the bottom line.
            line(sizes.initialx, sizes.initialy + sizes.ysize, sizes.initialx + sizes.xsize, sizes.initialy + sizes.ysize);

            // Draw the discs.
            for (let k = 0; k < discs.length; k++) {
                fill(colors[discs[k].playerId - 1]);
                noStroke();
                ellipse(discs[k].x, discs[k].y, sizes.rad, sizes.rad);
            }
        }

        // Display the message at the top.
        displayMessage();
    }
}

function connect() {
    console.log('Client connected with socket id ' + socket.id);
    // Keep a copy of the id.
    socketId = socket.id.slice();
}

function initialize(data) {
    // Receives the basic game data from master.
    sizes = data;
    sizes.boardx = sizes.canvasx / 2;
    sizes.boardytop = sizes.boardsize / 3;
    sizes.boardybot = sizes.boardsize * 2 / 3;
    sizes.rad = sizes.size * 3 / 4;
    initialized = true;
    let canvas = createCanvas(sizes.canvasx, sizes.canvasy);
    canvas.parent('sketch-holder');
    background(0);
    mode = 'init';
}

function wait() {
    mode = 'wait';
    buttonManager.removeAllButtons();
    buttonManager.appendButton('leave');
}

function begin(data) {
    // The game starts, I will find here my id and the current turn
    console.log('Game begins');
    playerId = data.playerId;
    turn = data.turn;
    console.log('I am player ' + playerId + ' and the turn is ' + turn);
    mode = 'play';
    buttonManager.removeAllButtons();
    buttonManager.appendButton('leave');
    buttonManager.appendButton('reset');
}

function updateTurn(data) {
    console.log('Server updates the turn');
    turn = data.turn;
}

function resetGame() {
    discs = [];
    mode = 'wait';
    turn = 1;
}

function addDisc(data) {
    // Receives a new disc and adds it to the list.
    discs.push(data);

    // Update the turn.
    turn = data.playerId == 1 ? 2 : 1;
}

function winner(data) {
    console.log('Player ' + data.playerId + ' is the winner!!');
    winnerId = data.playerId;
    mode = 'winner';
}

function leave() {
    buttonManager.removeAllButtons();
    buttonManager.appendButton('ready');
    mode = 'init';
}

function displayMessage() {
    // Diplay the messages on the board.
    switch (mode) {
        case 'init':
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            text('Press play to enter a room and play', sizes.boardx, sizes.boardytop);
            break;
        case 'wait':
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            text('Waiting for another player', sizes.boardx, sizes.boardytop);
            break;
        case 'play':
            // Display the turns.
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            if (isMyTurn()) {
                text('Playing. Your turn', sizes.boardx, sizes.boardytop);
            }
            else {
                text('Playing. Turn of player ' + turn, sizes.boardx, sizes.boardytop);
            }

            // Display the colors of the players.
            fill(colors[playerId - 1]);
            noStroke();
            textSize(20);
            textAlign(CENTER, CENTER);
            text('You are player ' + playerId, sizes.boardx, sizes.boardybot);
            break;
        case 'winner':
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            text('Player ' + winnerId + ' is the winner!', sizes.boardx, sizes.boardytop);

            // Display the colors of the players.
            fill(colors[playerId - 1]);
            noStroke();
            textSize(20);
            textAlign(CENTER, CENTER);
            text('You are player ' + playerId, sizes.boardx, sizes.boardybot);
            break;
    }
}

function isMyTurn() {
    // Decides if it is this client's turn.
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
    if (!inside(mouseX, mouseY)) {
        console.log('Ignoring click: outside the canvas');
        return;
    }

    socket.emit('clicked', { socketId: socketId, x: mouseX, y: mouseY });
}

function inside(mx, my) {
    // Receives a mouse click and decides if it was inside the canvas or not.
    let xtrue = 0 < mx && mx < sizes.canvasx;
    let ytrue = 0 < my && my < sizes.canvasy;
    return xtrue && ytrue;
}

// Functions for buttons

function readyHandler() {
    // This function is triggered with the ready button.
    console.log('Client wants to play');
    let data = {
        socketId: socketId
    };
    socket.emit('ready', data);
}

function resetHandler() {
    // Function triggered with the reset button.
    console.log('Client resets the game');
    let data = {
        socketId: socketId
    };
    socket.emit('reset', data);
}

function leaveHandler() {
    // Function triggered with the leave button.
    console.log('Client leaves the room');
    let data = {
        socketId: socketId
    };
    socket.emit('leave', data);

    // Client has to return to the original state
    leave();
}
