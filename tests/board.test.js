import { describe, it, expect } from "vitest";
import { BOARD_SIZE, createBoard } from "../src/game/board.js";

describe("Module ban co(Board)", () => {
  // 1. Test kich thuoc ban co
  it("kich thuoc ban co la 10 o", () => {
    expect(BOARD_SIZE).toBe(10);
  });
  // 2. Test tao ban co
  it("tao ban co dung kich thuoc 10x10", () => {
    const board = createBoard();
    expect(board.length).toBe(BOARD_SIZE);
    expect(board.every((row) => row.length === BOARD_SIZE)).toBe(true);
  });
  // 3. Test ban co rong
  it("ban co rong khi tao", () => {
    const board = createBoard();
    expect(board.every((row) => row.every((cell) => cell === null))).toBe(true);
  });
  // 4. createBoard() tra ve mot ban co moi moi lan goi (tranh tham chieu chung)
  it("createBoard() tra ve mot ban co moi moi lan goi, cac ban co la doc lap (tranh tham chieu chung)", () => {
    const board1 = createBoard();
    const board2 = createBoard();
    expect(board1).not.toBe(board2);
    // Kiem tra xem thay doi mot o trong board1 co anh huong den board2 khong
    board1[0][0] = "X";
    expect(board2[0][0]).toBeNull();
  });
});
