const { createBoard } = require("./board");
const { createShips } = require("./ships");
const { placeShip } = require("./placement");
const { fireShot } = require("./shooting");

const board = createBoard();
const ships = createShips();
const shots = new Set();

const destroyer = ships.find((ship) => ship.name === "Destroyer");

placeShip(board, destroyer, 0, 0, "horizontal");

console.log("Shot 1:", fireShot(board, ships, shots, 0, 0));
console.log("Shot 2:", fireShot(board, ships, shots, 5, 5));
console.log("Shot 3:", fireShot(board, ships, shots, 0, 1));
console.log("Shot 4:", fireShot(board, ships, shots, 0, 1));
console.log("Shot 5:", fireShot(board, ships, shots, 1, 11));
console.log("Shot 5:", fireShot(board, ships, shots, -1, 11));
