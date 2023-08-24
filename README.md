# four-in-a-row
Simple four in a row game that implements server/client design.

## How it works
The game is programmed with `Node.js` at the backend and `p5.js` at the frontend.
`Socket.IO` is used for the communication bewteen the client and the server.

When the user connects to the application, they will be able to look for a new game.
If the user decides to do so, they will wait in a room for another player to connect.
Once another player is found, the game will start. At this point, the player will be able to select to play again or leave the room.
In that case, the room will dissolve and both players will have to look for a new game again.

Inside a room, a counter will display the current winrate of each of the players.
The turn will be random for the first game and will alternate from then on.
The color of the player cannot be chosen, and is constant for a given room.

## How to run it
Clone the repository on a Linux box and run:
* `npm install`
* `npm start`

The server will be availabe at the Linux box, on port 8080 by default.

The logging server-side is done with the `winston` node package, and is outputted to the console and to a file.
This log has different levels of severity.
After running the application for a while, you can read the logs in a file called `server.log`.
