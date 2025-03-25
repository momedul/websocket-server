const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const rooms = {}; // Store game state per room

server.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "join") {
            if (!rooms[data.room]) {
                rooms[data.room] = { players: [], board: ["", "", "", "", "", "", "", "", ""], turned: null };
            }
			if (rooms[data.room].players.length > 2) {
				ws.send(JSON.stringify({ type: "error", message: "Room is full! Disconnecting..." }));
				ws.close();
				return;
			}
            if (rooms[data.room].players.length < 2) {
				ws.symbol = rooms[data.room].players.length === 0 ? "X" : (rooms[data.room].players[0].symbol === "X" ? "O" : "X");
				rooms[data.room].players.push(ws);
				rooms[data.room].players.forEach(player =>
					player.send(JSON.stringify({
						type: "join",
						players: rooms[data.room].players.length,
						symbol: ws.symbol,
						board: rooms[data.room].board,
						player: player === ws ? "Y" : "O",
						turned: rooms[data.room].turned
					}))
				);
            }
        }
        
        if (data.type === "move") {
            if (rooms[data.room]) {  // Ensure the room exists
				rooms[data.room].board = data.board;
				rooms[data.room].players.forEach(player =>
					player.send(JSON.stringify({
						type: "update",
						players: rooms[data.room].players.length,
						board: data.board,
						player: player === ws ? "Y" : "O",
						turned: player.symbol === data.turn ? "Y" : "O"
					}))
				);
			}
        }
    });
    
    ws.on('close', () => {
        for (let room in rooms) {
            rooms[room].players = rooms[room].players.filter(player => player !== ws);
            if (rooms[room].players.length === 0){
				delete rooms[room];
			}else if (rooms[room].players.length < 2){
				rooms[room].players.forEach(player =>
					player.send(JSON.stringify({
						type: "leave",
						players: rooms[room].players.length,
						symbol: ws.symbol,
						board: rooms[room].board,
						player: player === ws ? "Y" : "O"
					}))
				);
			}
        }
    });
});

console.log("WebSocket server running on ws://localhost:8080");
