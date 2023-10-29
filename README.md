# four-in-a-row
Simple four in a row game that implements server/client design.

## How it works
The game is programmed with `Node.js` at the backend and `p5.js` at the frontend.
`Socket.IO` is used for the communication bewteen the client and the server.

When the user connects to the application, they will be able to look for a new game.
If the user decides to do so, they will wait in a room for another player to connect.
Once another player is found, the game will start.
While the game is on, each of the players will be able to leave, kicking the other player from the room as well.
Once a player wins, each of the players can choose to play again or leave the room.

Inside a room, a counter will display the current winrate of each of the players.
The turn will be random for the first game and will alternate from then on.
The color of the player cannot be chosen, and is constant for a given room.

<img src="https://github.com/aitorperezzz/four-in-a-row/blob/master/images/readme_image.png" alt="drawing" align="center" width="50%"/>

## How to run it
Clone the repository on a Linux box and run:
* `npm install`
* `npm start`

The server will be availabe at the Linux box, on port 8080.

The logging server-side is done with the `winston` node package, and is outputted to the console and to a file.
This log has different levels of severity.
After running the application for a while, you can read the logs in a file called `server.log`.

If running the application with Docker, run `docker compose up` after cloning the repo, and the server will be available on port 8080 of the host machine by default.
The port can be changed by modifying the file `compose.yaml`.
After composing the application, if changes have been done to the source code, remember to run `docker compose build` before `docker compose up` to first rebuild the Docker image and then relaunch the container.
