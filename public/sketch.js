// Declare the socket variables.
let socket;
let idSocket;
let initialized = false;

// Declare an object to store lengths.
let sizes = {};

// Declare some global variables for the game logic.
let mode = 'waiting';
let discs = [];
let players = [];
let turn;
let idPlayer = 0;
let colors;
let winner;

function setup() {
    // Connect the socket to the server.
    socket = io();

    // Create the colors array.
    colors = [color(255, 0, 0), color(255, 255, 102)]

    // Declare the functions that will handle the different events.
    socket.on('connect', connect);
    socket.on('initialize', initialize);
    socket.on('addPlayer', addPlayer);
    socket.on('updateMode', updateMode);
    socket.on('addDisc', addDisc);
    socket.on('winner', newWinner);
}

function draw() {
    // Draw a background.
    background(0);

    if (initialized) {
        if (mode == 'playing' || mode == 'winner') {
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
                fill(colors[discs[k].idPlayer - 1]);
                noStroke();
                ellipse(discs[k].x, discs[k].y, sizes.rad, sizes.rad);
            }
        }

        // Display the message at the top.
        displayMessage();
    }
}

function connect() {
    console.log('Client is now connected with id: ' + socket.id);
    // Keep a copy of the id.
    idSocket = socket.id.slice();
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
}

function addPlayer(data) {
    // A new player comes as information, so update.
    console.log('Updating players');
    players.push(data);

    // Update my idPlayer if I'm one of the players.
    for (let k = 0; k < players.length; k++) {
        if (players[k].idSocket == idSocket) {
            // I am this player.
            idPlayer = players[k].idPlayer;
            return;
        }
    }
}

function updateMode(data) {
    console.log('Changing to ' + data.mode + ' mode');
    switch (data.mode) {
        case 'playing':
            mode = 'playing';
            turn = 1;
            break;
        case 'waiting':
            resetGame();
    }
}

function resetGame() {
    // Resets all values to the default at the beginning.
    idPlayer = 0;
    players = [];
    discs = [];
    mode = 'waiting';
    turn = 1;
}

function addDisc(data) {
    // Receives a new disc and adds it to the list.
    discs.push(data);

    // Update the turn.
    turn = data.idPlayer == 1 ? 2 : 1;
}

function newWinner(data) {
    console.log('Player ' + data.idPlayer + ' is the winner!!');
    winner = data.idPlayer;
    mode = 'winner';
}

function displayMessage() {
    // Diplay the messages on the board.
    switch (mode) {
        case 'waiting':
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            text('Waiting for players...', sizes.boardx, sizes.boardytop);
            break;
        case 'playing':
            // Display the turns.
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            if (myTurn()) {
                text('Playing. Your turn', sizes.boardx, sizes.boardytop);
            }
            else {
                text('Playing. Turn of player ' + turn, sizes.boardx, sizes.boardytop);
            }

            // Display the colors of the players.
            fill(colors[idPlayer - 1]);
            noStroke();
            textSize(20);
            textAlign(CENTER, CENTER);
            text('You are player ' + idPlayer, sizes.boardx, sizes.boardybot);
            break;
        case 'winner':
            fill(255);
            noStroke();
            textSize(25);
            textAlign(CENTER, CENTER);
            text('Player ' + winner + ' is the winner!', sizes.boardx, sizes.boardytop);

            // Display the colors of the players.
            fill(colors[idPlayer - 1]);
            noStroke();
            textSize(20);
            textAlign(CENTER, CENTER);
            text('You are player ' + idPlayer, sizes.boardx, sizes.boardybot);
            break;
    }
}

function myTurn() {
    // Decides if it is this client's turn.
    return idPlayer == turn;
}


function mousePressed() {
    // Only send the click if it was inside the canvas.
    if (inside(mouseX, mouseY)) {
        console.log('Sending click to the server');
        let data = {
            idSocket: idSocket,
            x: mouseX,
            y: mouseY
        };
        socket.emit('clicked', data);
    }
    else {
        console.log('Click outside the canvas. Not sending');
    }
}

function inside(mx, my) {
    // Receives a mouse click and decides if it was inside the canvas or not.
    let xtrue = 0 < mx && mx < sizes.canvasx;
    let ytrue = 0 < my && my < sizes.canvasy;
    return xtrue && ytrue;
}

// FUNCTIONS FOR BUTTONS.
function ready() {
    // This function is triggered with the ready button.
    console.log('Client presses ready button');
    let data = {
        idSocket: idSocket
    };
    socket.emit('ready', data);
}

function leave() {
    // Function triggered with the leave button.
    console.log('Client presses leave button');
    let data = {
        idSocket: idSocket
    };
    socket.emit('leave', data);
}
