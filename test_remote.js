const io = require('socket.io-client');
const url = 'http://localhost:3000';

console.log("Connecting to", url);

function createClient(name) {
    const socket = io(url, { transports: ['websocket'] });
    let isConnected = false;

    socket.on('connect', () => {
        console.log(`[${name}] Connected with ID: ${socket.id}`);
        socket.emit('join_game', { playerName: name });
        isConnected = true;
    });

    socket.on('auth_success', (data) => {
        console.log(`[${name}] Auth success: ${data.id}`);
        
        setInterval(() => {
            if (isConnected) {
                socket.emit('player_move', { x: Math.random() * 100, y: 100, isFacingRight: true, level: 'level 1' });
            }
        }, 100);
    });

    socket.on('sync_state', (data) => {
        const keys = Object.keys(data.players);
        console.log(`[${name}] sync_state received. Total players in state: ${keys.length}`);
    });

    socket.on('disconnect', () => {
        console.log(`[${name}] Disconnected!`);
        isConnected = false;
    });
    
    socket.on('connect_error', (err) => {
        console.log(`[${name}] Connection error: ${err.message}`);
    });
}

createClient('Player1');
setTimeout(() => createClient('Player2'), 2000);

setTimeout(() => {
    console.log("Ending test...");
    process.exit(0);
}, 6000);
