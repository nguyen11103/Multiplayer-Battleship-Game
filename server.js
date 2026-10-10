const express = require("express");
const http = require("node:http");
const { Server } = require("socket.io");

const {
  ROOM_STATUS,
  joinRoom,
  placePlayerShip,
  setPlayerReady,
  shoot,
} = require("./src/game/roomManager");

const { createRoomStore } = require("./src/game/roomStore");

function createGameServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const roomStore = createRoomStore();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({
      message: "Multiplayer Battleship Server is running!",
    });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Chỉ trả thông tin công khai, không trả bàn cờ hoặc vị trí tàu.
  function getPublicRoomState(room) {
    return {
      roomId: room.id,
      status: room.status,
      players: room.players.map((player) => ({
        id: player.id,
        ready: player.ready,
      })),
      currentTurn: room.currentTurn,
      winnerId: room.winnerId,
    };
  }

  function sendRoomUpdate(room) {
    io.to(room.id).emit("room_updated", getPublicRoomState(room));
  }

  function acknowledge(callback, data) {
    if (typeof callback === "function") {
      callback(data);
    }
  }

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Event 1: Tạo phòng và tự động tham gia.
    socket.on("create_room", (callback) => {
      const created = roomStore.createRoomForPlayer(socket.id);

      if (!created.success) {
        return acknowledge(callback, {
          success: false,
          error: created.error,
        });
      }

      const { room } = created;
      socket.join(room.id);

      acknowledge(callback, {
        success: true,
        playerId: socket.id,
        room: getPublicRoomState(room),
      });

      sendRoomUpdate(room);
    });

    // Event 2: Tham gia phòng bằng mã phòng.
    socket.on("join_room", (payload, callback) => {
      const roomId =
        typeof payload?.roomId === "string"
          ? payload.roomId.trim().toUpperCase()
          : "";

      if (!roomId) {
        return acknowledge(callback, {
          success: false,
          error: "Room ID is required",
        });
      }

      const room = roomStore.getRoom(roomId);

      if (!room) {
        return acknowledge(callback, {
          success: false,
          error: "Room not found",
        });
      }

      const result = joinRoom(room, socket.id);

      if (!result.success) {
        return acknowledge(callback, result);
      }

      socket.join(room.id);

      acknowledge(callback, {
        success: true,
        playerId: socket.id,
        room: getPublicRoomState(room),
      });

      sendRoomUpdate(room);
    });

    // Event 3: Đặt tàu.
    socket.on("place_ship", (payload, callback) => {
      const roomId = payload?.roomId;
      const room = roomStore.getRoom(roomId);

      if (!room) {
        return acknowledge(callback, {
          success: false,
          error: "Room not found",
        });
      }

      const result = placePlayerShip(
        room,
        socket.id,
        payload?.shipName,
        payload?.row,
        payload?.col,
        payload?.orientation,
      );

      if (!result.success) {
        return acknowledge(callback, result);
      }

      acknowledge(callback, {
        success: true,
        shipName: payload.shipName,
      });

      sendRoomUpdate(room);
    });

    // Event 4: Xác nhận đã đặt đủ tàu.
    socket.on("player_ready", (payload, callback) => {
      const room = roomStore.getRoom(payload?.roomId);

      if (!room) {
        return acknowledge(callback, {
          success: false,
          error: "Room not found",
        });
      }

      const result = setPlayerReady(room, socket.id);

      if (!result.success) {
        return acknowledge(callback, result);
      }

      acknowledge(callback, {
        success: true,
        status: result.status,
        currentTurn: result.currentTurn,
      });

      sendRoomUpdate(room);

      if (room.status === ROOM_STATUS.PLAYING) {
        io.to(room.id).emit("game_started", getPublicRoomState(room));
      }
    });

    // Event 5: Bắn vào bàn cờ đối thủ.
    socket.on("shoot", (payload, callback) => {
      const room = roomStore.getRoom(payload?.roomId);

      if (!room) {
        return acknowledge(callback, {
          success: false,
          error: "Room not found",
        });
      }

      const result = shoot(room, socket.id, payload?.row, payload?.col);

      if (!result.success) {
        return acknowledge(callback, result);
      }

      const shotEvent = {
        shooterId: socket.id,
        row: payload.row,
        col: payload.col,
        result: result.result,
        sunk: result.sunk,
        gameOver: result.gameOver,
        status: result.status,
        nextTurn: result.nextTurn,
        winnerId: result.winnerId,
      };

      acknowledge(callback, {
        success: true,
        ...shotEvent,
      });

      io.to(room.id).emit("shot_result", shotEvent);
      sendRoomUpdate(room);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return { app, httpServer, io, roomStore };
}

// Chạy server chỉ khi gọi node server.js.
// Khi import file trong test, server không tự mở cổng.
if (require.main === module) {
  const { httpServer } = createGameServer();
  const PORT = process.env.PORT || 3000;

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = { createGameServer };
