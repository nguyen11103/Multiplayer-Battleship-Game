const { randomUUID } = require("node:crypto");
const { createRoom, joinRoom } = require("./roomManager");

function createRoomStore() {
  const rooms = new Map();

  function createRoomForPlayer(playerId) {
    let roomId;

    // Tránh trùng mã phòng đang tồn tại.
    do {
      roomId = randomUUID().slice(0, 6).toUpperCase();
    } while (rooms.has(roomId));

    const room = createRoom(roomId);
    const result = joinRoom(room, playerId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    rooms.set(roomId, room);

    return {
      success: true,
      room,
      player: result.player,
    };
  }

  function getRoom(roomId) {
    return rooms.get(roomId);
  }

  function findRoomByPlayerId(playerId) {
    for (const room of rooms.values()) {
      if (room.players.some((player) => player.id === playerId)) {
        return room;
      }
    }

    return null;
  }

  function deleteRoom(roomId) {
    return rooms.delete(roomId);
  }

  return {
    rooms,
    createRoomForPlayer,
    getRoom,
    findRoomByPlayerId,
    deleteRoom,
  };
}

module.exports = { createRoomStore };
