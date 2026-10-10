import { describe, it, expect } from "vitest";

const {
  ROOM_STATUS,
  createRoom,
  joinRoom,
  placePlayerShip,
  setPlayerReady,
  shoot,
} = require("../src/game/roomManager");

function setupRoom() {
  const room = createRoom("TEST01");

  joinRoom(room, "player-A");
  joinRoom(room, "player-B");

  return room;
}

function placeAllShips(room, playerId) {
  const ships = [
    { name: "Carrier", row: 0 },
    { name: "Battleship", row: 1 },
    { name: "Cruiser", row: 2 },
    { name: "Submarine", row: 3 },
    { name: "Destroyer", row: 4 },
  ];

  for (const ship of ships) {
    const result = placePlayerShip(
      room,
      playerId,
      ship.name,
      ship.row,
      0,
      "horizontal",
    );

    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

function startGame() {
  const room = setupRoom();

  placeAllShips(room, "player-A");
  placeAllShips(room, "player-B");

  setPlayerReady(room, "player-A");
  setPlayerReady(room, "player-B");

  return room;
}

describe("Room System", () => {
  it("should create a room in waiting state", () => {
    const room = createRoom("ROOM01");

    expect(room.id).toBe("ROOM01");
    expect(room.status).toBe(ROOM_STATUS.WAITING);
    expect(room.players).toHaveLength(0);
    expect(room.currentTurn).toBeNull();
  });

  it("should allow two players to join", () => {
    const room = setupRoom();

    expect(room.players).toHaveLength(2);
  });

  it("should reject a third player", () => {
    const room = setupRoom();

    const result = joinRoom(room, "player-C");

    expect(result.success).toBe(false);
    expect(room.players).toHaveLength(2);
  });

  it("should reject a player joining twice", () => {
    const room = setupRoom();

    const result = joinRoom(room, "player-A");

    expect(result.success).toBe(false);
    expect(room.players).toHaveLength(2);
  });

  it("should not start before all ships are placed", () => {
    const room = setupRoom();

    const result = setPlayerReady(room, "player-A");

    expect(result.success).toBe(false);
    expect(room.status).toBe(ROOM_STATUS.WAITING);
  });

  it("should start when both players are ready", () => {
    const room = setupRoom();

    placeAllShips(room, "player-A");
    placeAllShips(room, "player-B");

    const firstReady = setPlayerReady(room, "player-A");

    expect(firstReady.success).toBe(true);
    expect(room.status).toBe(ROOM_STATUS.WAITING);

    const secondReady = setPlayerReady(room, "player-B");

    expect(secondReady.success).toBe(true);
    expect(room.status).toBe(ROOM_STATUS.PLAYING);
    expect(room.currentTurn).toBe("player-A");
  });

  it("should reject a shot when it is not the player's turn", () => {
    const room = startGame();

    const result = shoot(room, "player-B", 9, 9);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not your turn");
    expect(room.currentTurn).toBe("player-A");
  });

  it("should switch turns after a valid shot", () => {
    const room = startGame();

    // Carrier của player-B nằm tại hàng 0, cột 0 đến 4.
    const result = shoot(room, "player-A", 0, 0);

    expect(result.success).toBe(true);
    expect(result.result).toBe("hit");
    expect(room.currentTurn).toBe("player-B");
  });

  it("should not switch turns after an invalid shot", () => {
    const room = startGame();

    shoot(room, "player-A", 9, 9);

    const result = shoot(room, "player-B", 9, 9);

    // player-B đã đến lượt nên phát bắn này hợp lệ.
    expect(result.success).toBe(true);
    expect(room.currentTurn).toBe("player-A");
  });

  it("should finish the game when a player sinks every enemy ship", () => {
    const room = startGame();

    const playerA = room.players.find((player) => player.id === "player-A");

    const playerB = room.players.find((player) => player.id === "player-B");

    let result;
    let replyCount = 0;

    // A lần lượt bắn vào tất cả vị trí tàu của B.
    for (const ship of playerB.ships) {
      for (const position of ship.positions) {
        result = shoot(room, "player-A", position.row, position.col);

        // Phát bắn không hợp lệ thì dừng test để dễ phát hiện lỗi.
        expect(result.success).toBe(true);
        expect(result.result).toBe("hit");

        // Nếu toàn bộ tàu của B đã bị đánh chìm, kết thúc.
        if (result.gameOver) {
          break;
        }

        // B phải bắn trả để chuyển lượt về A.
        // Tàu được đặt ở các hàng 0–4, nên hàng 8 và 9 là ô trống.
        const row = 8 + Math.floor(replyCount / 10);
        const col = replyCount % 10;

        const reply = shoot(room, "player-B", row, col);

        expect(reply.success).toBe(true);
        expect(reply.result).toBe("miss");

        replyCount++;
      }

      if (result.gameOver) {
        break;
      }
    }

    expect(result.gameOver).toBe(true);
    expect(result.status).toBe("finished");
    expect(result.winnerId).toBe("player-A");

    expect(room.status).toBe("finished");
    expect(room.winnerId).toBe("player-A");
    expect(room.currentTurn).toBe(null);
  });

  it("should reject shots after the game has finished", () => {
    const room = startGame();

    const playerB = room.players.find((player) => player.id === "player-B");

    // Bắn hết các ô tàu của B, luân phiên hai người.
    for (const ship of playerB.ships) {
      for (const position of ship.positions) {
        const result = shoot(room, "player-A", position.row, position.col);

        if (result.gameOver) {
          break;
        }

        // Tìm một ô chưa bắn để B kết thúc lượt của mình.
        for (let row = 9; row >= 0; row--) {
          let found = false;

          for (let col = 0; col < 10; col++) {
            const reply = shoot(room, "player-B", row, col);

            if (reply.success) {
              found = true;
              break;
            }
          }

          if (found) {
            break;
          }
        }
      }

      if (room.status === ROOM_STATUS.FINISHED) {
        break;
      }
    }

    expect(room.status).toBe(ROOM_STATUS.FINISHED);

    const result = shoot(room, "player-A", 8, 8);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Game is not in progress");
  });
});
