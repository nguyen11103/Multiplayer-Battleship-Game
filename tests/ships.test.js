import { describe, it, expect } from "vitest";
const { createBoard } = require("../src/game/board");
const { createShips } = require("../src/game/ships");
const { placeShip } = require("../src/game/placement");

describe("kiem tra ham placeShip()", () => {
  it("dat tau nam ngang", () => {
    const board = createBoard();
    const ship = createShips()[0];

    const result = placeShip(board, ship, 0, 0, "horizontal");

    expect(result.success).toBe(true);
    expect(ship.positions).toHaveLength(5);
    expect(board[0][0]).toBe("Carrier");
    expect(board[0][4]).toBe("Carrier");
  });

  it("dat tau nam doc", () => {
    const board = createBoard();
    const ship = createShips()[0];

    const result = placeShip(board, ship, 0, 0, "vertical");

    expect(result.success).toBe(true);
    expect(board[0][0]).toBe("Carrier");
    expect(board[4][0]).toBe("Carrier");
  });

  it("dat tau ngoai ban co", () => {
    const board = createBoard();
    const ship = createShips()[0];

    const result = placeShip(board, ship, 0, 7, "horizontal");

    expect(result.success).toBe(false);
    expect(board[0].every((cell) => cell === null)).toBe(true);
  });

  it("dat tau trung nhau", () => {
    const board = createBoard();
    const ships = createShips();

    placeShip(board, ships[0], 0, 0, "horizontal");

    const result = placeShip(board, ships[1], 0, 3, "horizontal");

    expect(result.success).toBe(false);
    expect(board[0][3]).toBe("Carrier");
    expect(ships[1].positions).toHaveLength(0);
  });

  it("dat tau voi huong khong hop le", () => {
    const board = createBoard();
    const ship = createShips()[0];

    const result = placeShip(board, ship, 0, 0, "diagonal");

    expect(result.success).toBe(false);
    expect(board[0][0]).toBeNull();
  });

  it("dat tau voi toa do am", () => {
    const board = createBoard();
    const ship = createShips()[0];

    const result = placeShip(board, ship, -1, 0, "horizontal");

    expect(result.success).toBe(false);
  });
});
