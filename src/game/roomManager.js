const { randomUUID } = require("node:crypto");

const { createBoard } = require("./board");
const { createShips } = require("./ships");
const { placeShip } = require("./placement");
const { fireShot } = require("./shooting");

const ROOM_STATUS = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
};

const MAX_PLAYERS = 2;

function createRoom(roomId = randomUUID().slice(0, 6).toUpperCase()) {
  const room = {
    id: roomId,
    status: ROOM_STATUS.WAITING,
    players: [],
    currentTurn: null,
    winnerId: null,
  };

  return room;
}

function findPlayer(room, playerId) {
  return room.players.find((player) => player.id === playerId);
}

function joinRoom(room, playerId) {
  if (room.status !== ROOM_STATUS.WAITING) {
    return { success: false, error: "Room is not waiting" };
  }

  if (room.players.length >= MAX_PLAYERS) {
    return { success: false, error: "Room is full" };
  }

  if (findPlayer(room, playerId)) {
    return { success: false, error: "Player already joined" };
  }

  const player = {
    id: playerId,
    board: createBoard(),
    ships: createShips(),
    shots: new Set(),
    ready: false,
  };

  room.players.push(player);

  return { success: true, player };
}

function placePlayerShip(room, playerId, shipName, row, col, orientation) {
  if (room.status !== ROOM_STATUS.WAITING) {
    return { success: false, error: "Cannot place ships now" };
  }

  const player = findPlayer(room, playerId);

  if (!player) {
    return { success: false, error: "Player not found" };
  }

  if (player.ready) {
    return { success: false, error: "Player is already ready" };
  }

  const ship = player.ships.find((item) => item.name === shipName);

  if (!ship) {
    return { success: false, error: "Ship not found" };
  }

  if (ship.positions.length > 0) {
    return { success: false, error: "Ship already placed" };
  }

  return placeShip(player.board, ship, row, col, orientation);
}

function setPlayerReady(room, playerId) {
  if (room.status !== ROOM_STATUS.WAITING) {
    return { success: false, error: "Room is not waiting" };
  }

  const player = findPlayer(room, playerId);

  if (!player) {
    return { success: false, error: "Player not found" };
  }

  const allShipsPlaced = player.ships.every(
    (ship) => ship.positions.length === ship.size,
  );

  if (!allShipsPlaced) {
    return { success: false, error: "Not all ships are placed" };
  }

  player.ready = true;

  const allPlayersReady =
    room.players.length === MAX_PLAYERS &&
    room.players.every((item) => item.ready);

  if (allPlayersReady) {
    room.status = ROOM_STATUS.PLAYING;
    room.currentTurn = room.players[0].id;
  }

  return {
    success: true,
    status: room.status,
    currentTurn: room.currentTurn,
  };
}

function shoot(room, playerId, row, col) {
  if (room.status !== ROOM_STATUS.PLAYING) {
    return { success: false, error: "Game is not in progress" };
  }

  if (room.currentTurn !== playerId) {
    return { success: false, error: "Not your turn" };
  }

  const attacker = findPlayer(room, playerId);

  if (!attacker) {
    return { success: false, error: "Player not found" };
  }

  const opponent = room.players.find((player) => player.id !== playerId);

  if (!opponent) {
    return { success: false, error: "Opponent not found" };
  }

  const result = fireShot(
    opponent.board,
    opponent.ships,
    attacker.shots,
    row,
    col,
  );

  if (!result.success) {
    return result;
  }

  if (result.gameOver) {
    room.status = ROOM_STATUS.FINISHED;
    room.winnerId = playerId;
    room.currentTurn = null;
  } else {
    // Trong phiên bản này, hit và miss đều chuyển lượt.
    room.currentTurn = opponent.id;
  }

  return {
    ...result,
    nextTurn: room.currentTurn,
    status: room.status,
    winnerId: room.winnerId,
  };
}

module.exports = {
  ROOM_STATUS,
  createRoom,
  joinRoom,
  placePlayerShip,
  setPlayerReady,
  shoot,
};
