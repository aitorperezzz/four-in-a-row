// Declare the socket.
let socket;

function setup() {
  createCanvas(800, 800);
  background(0);

  // Connect the socket to the server.
  socket = io.connect('http://localhost:8080');

  // Declare the functions that will handle incoming messages.
  socket.on('beginGame', beginGame);
  socket.on('setPlayer', setPlayer);



  socket.on('clickedByOthers', clickedByOthers);
}

function draw() {
  //background(0);
}

function mousePressed() {
  // When the user clicks, send that information to the server.
  let name = 'clicked';
  let data = {
    x: mouseX,
    y: mouseY
  }

  // Draw big ellipse where the client clicked.
  fill(255);
  noStroke();
  ellipse(mouseX, mouseY, 50, 50);

  console.log('Sending information to the server');
  socket.emit(name, data);
}

function clickedByOthers(data) {
  // This function runs if another cient has clicked the canvas.
  fill(255, 0, 0);
  noStroke();
  ellipse(data.x, data.y, 25, 25);
}

function playerReady() {
  socket.emit('ready', 0);
}

function beginGame(data) {
  // The grid has been updated.
  console.log('Beginning a game');
  client.beginGame(data);
}

function setPlayer(data) {
  console.log('Setting the player');
  client.setPlayer(data);
}

class Client {
  // This class does the game stuff for this client.
  constructor() {
    this.idSocket;
    this.idPlayer;
    this.mode;
    this.grid;
  }

  beginGame(grid) {
    this.mode = 'playing';
    this.grid = grid;
  }

  updateGrid(grid) {
    this.grid = grid;
  }

  setPlayer(data) {
    this.idPlayer = data.idPlayer;
    this.idSocket = data.idSocket;
  }

  draw() {

  }
}
