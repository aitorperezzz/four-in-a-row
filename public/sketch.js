// Declare the socket variables.
let socket;
let idSocket;

// Declare the size of the canvas.
let canvasx = 400;
let canvasy = 500;

// Declare some global variables for the game.
let mode = 'waiting';
let discs = [];
let players = [];
let sizes;

function calculateSizes() {
  // Calculates relevant sizes for the game
  // and stores them in the 'sizes' object.
  let xsize = Math.min(canvasx, canvasy - 100) * 6 / 7;
  let size = xsize / 7;
  let ysize = size * 6;
  let initialx = (canvasx - xsize) / 2;
  let initialy = 100 + (canvasy - 100 - ysize) / 2;
  let boardx = canvasx / 2;
  let boardy = 50;
  sizes = {
    xsize: xsize,
    ysize: ysize,
    size: size,
    initialx: initialx,
    initialy: initialy,
    boardx: boardx,
    boardy: boardy
  };
}

calculateSizes();

function setup() {
  createCanvas(canvasx, canvasy);
  background(0);

  // Connect the socket to the server.
  socket = io.connect('http://localhost:8080');

  // Declare the functions that will handle the different events.
  socket.on('connect', connect);
  socket.on('addPlayer', addPlayer);
  socket.on('beginGame', beginGame);
  socket.on('addDisc', addDisc);
}

function draw() {
  // Draw a background.
  background(0);

  if (mode == 'playing') {
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
      if (discs[k].idPlayer == 1) {
        // Player 1 is red.
        fill(255, 0, 0);
      }
      else if (discs[k].idPlayer == 2) {
        // Player 2 is yellow.
        fill(255, 255, 102);
      }
      noStroke();
      ellipse(discs[k].x, discs[k].y, 25, 25);
    }
  }

  // Display the message.
  displayMessage();
}

function connect() {
  console.log('Client is now connected with id: ' + socket.id);
  // Keep a copy of the id.
  idSocket = socket.id.slice();
}

function addPlayer(data) {
  // A new player comes as information, so update.
  console.log('Updating players');
  players.push(data);
  console.log(players);
}

function beginGame(data) {
  mode = 'playing';
}

function addDisc(data) {
  // Receives a new disc and adds it to the list.
  discs.push(data);
  console.log(discs);
}

function displayMessage() {
  fill(255);
  noStroke();
  textSize(25);
  textAlign(CENTER, CENTER);
  switch (mode) {
    case 'waiting':
      text('Waiting for players...', sizes.boardx, sizes.boardy);
      break;
    case 'playing':
      text('Playing', sizes.boardx, sizes.boardy);
  }
}


function mousePressed() {
  console.log('Sending a click to the server');
  let data = {
    idSocket: idSocket,
    x: mouseX,
    y: mouseY
  };
  socket.emit('clicked',  data);
}

function clientReady() {
  // This function is triggered with the HTML button.
  console.log('Sending a ready request');
  let data = {
    idSocket: idSocket
  };
  socket.emit('ready', data);
}
