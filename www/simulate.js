const io = require('socket.io-client');
const url = 'https://danger-ghost.onrender.com';
let connected = 0;

function createClient(name) {
    const socket = io(url);
    socket.on('connect', () => {
        console.log(`[${name}] Connected with ID: ${socket.id}`);
        socket.emit('join_game', { playerName: name, token: 'fake_token' });
    });
    
    socket.on('auth_success', (data) => {
        console.log(`[${name}] Auth success`);
        connected++;
        
        // Emite posições logo após sucesso
        setInterval(() => {
            socket.emit('player_move', { x: connected * 10, y: 100, isFacingRight: true, level: 1 });
        }, 100);
    });

    socket.on('auth_failed', (data) => {
        console.log(`[${name}] Auth failed: ${data.message}`);
    });

    socket.on('sync_state', (data) => {
        // Log sync state every 1 sec
        if (Math.random() < 0.1) {
            console.log(`[${name}] sync_state players keys:`, Object.keys(data.players).length);
        }
    });

    socket.on('attack_effect', (data) => {
        console.log(`[${name}] attack_effect:`, data);
    });
}

createClient('Player1');
createClient('Player2');

setTimeout(() => {
    console.log('Test complete');
    process.exit(0);
}, 3000);
