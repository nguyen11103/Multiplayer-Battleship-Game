import { describe, it, expect } from "vitest";
const { createBoard } = require("../src/game/board");
const { createShips } = require("../src/game/ships");
const { placeShip } = require("../src/game/placement");
const { fireShot, isShipSunk } = require("../src/game/shooting");

describe("Shooting System", () => {
  function setupGame() {
    const board = createBoard();
    const ships = createShips();
    const shots = new Set();

    // Đặt Destroyer ở hai ô (0,0) và (0,1).
    const destroyer = ships.find((ship) => ship.name === "Destroyer");

    placeShip(board, destroyer, 0, 0, "horizontal");

    return { board, ships, shots, destroyer };
  }

  it("should return hit when shooting a ship", () => {
    const { board, ships, shots } = setupGame();

    const result = fireShot(board, ships, shots, 0, 0);

    expect(result.success).toBe(true);
    expect(result.result).toBe("hit");
    expect(result.sunk).toBeNull();
    expect(result.gameOver).toBe(false);
  });

  it("should return miss when shooting an empty cell", () => {
    const { board, ships, shots } = setupGame();

    const result = fireShot(board, ships, shots, 5, 5);

    expect(result.success).toBe(true);
    expect(result.result).toBe("miss");
    expect(shots.has("5,5")).toBe(true);
  });

  it("should reject shooting the same cell twice", () => {
    const { board, ships, shots } = setupGame();

    fireShot(board, ships, shots, 5, 5);

    const result = fireShot(board, ships, shots, 5, 5);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Cell has already been targeted");
  });

  it("should reject an invalid coordinate", () => {
    const { board, ships, shots } = setupGame();

    const result = fireShot(board, ships, shots, 10, 0);

    expect(result.success).toBe(false);
    expect(shots.size).toBe(0);
  });

  it("should sink a ship when all its cells are hit", () => {
    const { board, ships, shots } = setupGame();

    fireShot(board, ships, shots, 0, 0);

    const result = fireShot(board, ships, shots, 0, 1);

    expect(result.success).toBe(true);
    expect(result.result).toBe("hit");
    expect(result.sunk).toBe("Destroyer");
    expect(result.gameOver).toBe(false);
  });

  it("should not sink a ship if one cell remains unhit", () => {
    const { board, ships, shots, destroyer } = setupGame();

    fireShot(board, ships, shots, 0, 0);

    expect(isShipSunk(destroyer)).toBe(false);
  });

  it("should report game over when all ships are sunk", () => {
    const { board, ships, shots } = setupGame();

    // Bắn hết các ô của Destroyer.
    fireShot(board, ships, shots, 0, 0);
    fireShot(board, ships, shots, 0, 1);

    // Các tàu còn lại chưa được đặt, nên đặt chúng lên bàn cờ.
    placeShip(board, ships[0], 2, 0, "horizontal");
    placeShip(board, ships[1], 3, 0, "horizontal");
    placeShip(board, ships[2], 4, 0, "horizontal");
    placeShip(board, ships[3], 5, 0, "horizontal");

    // Bắn toàn bộ ô của các tàu còn lại.
    const remainingShips = ships.filter((ship) => ship.name !== "Destroyer");

    let result;

    for (const ship of remainingShips) {
      for (const position of ship.positions) {
        result = fireShot(board, ships, shots, position.row, position.col);
      }
    }

    expect(result.gameOver).toBe(true);
  });
});
