class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> Set of player ids
        this.roomCounter = 0;
        this.MAX_PLAYERS = 4; // Maximum players per room
    }

    matchmake(playerId) {
        // Find an available room
        for (const [roomId, players] of this.rooms.entries()) {
            if (players.size < this.MAX_PLAYERS) {
                players.add(playerId);
                return roomId;
            }
        }
        
        // No available room, create a new one
        this.roomCounter++;
        const newRoomId = `room_${this.roomCounter}`;
        this.rooms.set(newRoomId, new Set([playerId]));
        return newRoomId;
    }

    removePlayer(playerId) {
        for (const [roomId, players] of this.rooms.entries()) {
            if (players.has(playerId)) {
                players.delete(playerId);
                if (players.size === 0) {
                    this.rooms.delete(roomId);
                }
                return roomId;
            }
        }
        return null;
    }

    getRoom(playerId) {
        for (const [roomId, players] of this.rooms.entries()) {
            if (players.has(playerId)) {
                return roomId;
            }
        }
        return null;
    }
}

module.exports = new RoomManager();
