const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const rooms = {}; // Store game state per room

server.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "join") {
            if (!rooms[data.room]) {
                rooms[data.room] = { players: [], board: ["", "", "", "", "", "", "", "", ""] };
            }
            if (rooms[data.room].players.length < 2) {
                rooms[data.room].players.push(ws);
                
				ws.send(JSON.stringify({ 
					type: "start", 
					players: rooms[data.room].players.length, 
					symbol: rooms[data.room].players.length === 1 ? "X" : "O", 
					board: rooms[data.room].board, 
					player: rooms[data.room].players.map(p => p === ws ? "Y" : "O") 
				}));
                
                if (rooms[data.room].players.length === 2) {
                    rooms[data.room].players.forEach(player => 
						player.send(JSON.stringify({
							type: "update",
							players: rooms[data.room].players.length,
							board: rooms[data.room].board,
							player: rooms[data.room].players.map(player => player === ws ? "Y" : "O")
						}))
					);
                }
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
						player: rooms[data.room].players.map(p => p === ws ? "Y" : "O") 
					}))
				);
			}
        }
    });
    
    ws.on('close', () => {
        for (let room in rooms) {
            rooms[room].players = rooms[room].players.filter(player => player !== ws);
            if (rooms[room].players.length === 0) delete rooms[room];
        }
    });
});

console.log("WebSocket server running on ws://localhost:8080");
