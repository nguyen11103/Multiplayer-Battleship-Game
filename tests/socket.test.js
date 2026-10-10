import { describe, it, expect, afterEach } from "vitest";

const { io: createClient } = require("socket.io-client");
const { createGameServer } = require("../server");

let game;
let clients = [];

function emitAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const callback = (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    };

    if (payload === undefined) {
      socket.timeout(3000).emit(event, callback);
    } else {
      socket.timeout(3000).emit(event, payload, callback);
    }
  });
}

async function startTestServer() {
  game = createGameServer();

  await new Promise((resolve) => {
    game.httpServer.listen(0, resolve);
  });

  const address = game.httpServer.address();
  const url = `http://127.0.0.1:${address.port}`;

  return url;
}

async function connectClient(url) {
  const client = createClient(url, {
    forceNew: true,
    reconnection: false,
  });

  clients.push(client);

  await new Promise((resolve, reject) => {
    client.once("connect", resolve);
    client.once("connect_error", reject);
  });

  return client;
}

async function createTwoPlayerRoom() {
  const url = await startTestServer();

  const playerA = await connectClient(url);
  const playerB = await connectClient(url);

  const created = await emitAck(playerA, "create_room");
  const joined = await emitAck(playerB, "join_room", {
    roomId: created.room.roomId,
  });

  expect(created.success).toBe(true);
  expect(joined.success).toBe(true);

  return {
    playerA,
    playerB,
    roomId: created.room.roomId,
  };
}

async function placeAllShips(client, roomId) {
  const ships = [
    { shipName: "Carrier", row: 0, col: 0 },
    { shipName: "Battleship", row: 1, col: 0 },
    { shipName: "Cruiser", row: 2, col: 0 },
    { shipName: "Submarine", row: 3, col: 0 },
    { shipName: "Destroyer", row: 4, col: 0 },
  ];

  for (const ship of ships) {
    const result = await emitAck(client, "place_ship", {
      roomId,
      ...ship,
      orientation: "horizontal",
    });

    expect(result.success).toBe(true);
  }
}

afterEach(async () => {
  for (const client of clients) {
    client.disconnect();
  }

  clients = [];

  if (game) {
    await new Promise((resolve) => {
      game.io.close(resolve);
    });

    game = null;
  }
});

describe("Socket.IO game events", () => {
  it("should create a room and let another player join", async () => {
    const url = await startTestServer();
    const playerA = await connectClient(url);
    const playerB = await connectClient(url);

    const created = await emitAck(playerA, "create_room");

    expect(created.success).toBe(true);
    expect(created.room.roomId).toBeTruthy();
    expect(created.room.players).toHaveLength(1);

    const joined = await emitAck(playerB, "join_room", {
      roomId: created.room.roomId,
    });

    expect(joined.success).toBe(true);
    expect(joined.room.players).toHaveLength(2);
  });

  it("should reject joining a room that does not exist", async () => {
    const url = await startTestServer();
    const client = await connectClient(url);

    const result = await emitAck(client, "join_room", {
      roomId: "NOPE99",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Room not found");
  });

  it("should reject ready before all ships are placed", async () => {
    const url = await startTestServer();
    const client = await connectClient(url);

    const created = await emitAck(client, "create_room");

    const result = await emitAck(client, "player_ready", {
      roomId: created.room.roomId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not all ships are placed");
  });

  it("should start a game and enforce turn order when shooting", async () => {
    const { playerA, playerB, roomId } = await createTwoPlayerRoom();

    await placeAllShips(playerA, roomId);
    await placeAllShips(playerB, roomId);

    const readyA = await emitAck(playerA, "player_ready", {
      roomId,
    });

    expect(readyA.success).toBe(true);
    expect(readyA.status).toBe("waiting");

    const readyB = await emitAck(playerB, "player_ready", {
      roomId,
    });

    expect(readyB.success).toBe(true);
    expect(readyB.status).toBe("playing");

    // Player B chưa đến lượt nên không được bắn.
    const wrongTurn = await emitAck(playerB, "shoot", {
      roomId,
      row: 0,
      col: 0,
    });

    expect(wrongTurn.success).toBe(false);
    expect(wrongTurn.error).toBe("Not your turn");

    // Player A bắn trúng tàu của B.
    const shotA = await emitAck(playerA, "shoot", {
      roomId,
      row: 0,
      col: 0,
    });

    expect(shotA.success).toBe(true);
    expect(shotA.result).toBe("hit");
    expect(shotA.nextTurn).toBe(playerB.id);

    // Player B bắn vào ô trống trên bàn của A.
    const shotB = await emitAck(playerB, "shoot", {
      roomId,
      row: 9,
      col: 9,
    });

    expect(shotB.success).toBe(true);
    expect(shotB.result).toBe("miss");
    expect(shotB.nextTurn).toBe(playerA.id);
  });

  it("should not expose board or ship positions in room responses", async () => {
    const url = await startTestServer();
    const client = await connectClient(url);

    const created = await emitAck(client, "create_room");

    expect(created.room.board).toBeUndefined();
    expect(created.room.ships).toBeUndefined();

    expect(created.room.players[0].board).toBeUndefined();
    expect(created.room.players[0].ships).toBeUndefined();
  });
});
