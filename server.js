const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Multiplayer Battleship Server is running!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
