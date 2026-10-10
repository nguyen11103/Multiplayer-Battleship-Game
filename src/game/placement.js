function placeShip(board, ship, startRow, startCol, orientation) {
  const boardSize = board.length;

  if (
    !Number.isInteger(startRow) ||
    !Number.isInteger(startCol) ||
    startRow < 0 ||
    startCol < 0 ||
    startRow >= boardSize ||
    startCol >= boardSize
  ) {
    return { success: false, error: "Invalid starting position" };
  }

  if (orientation !== "horizontal" && orientation !== "vertical") {
    return { success: false, error: "Invalid orientation" };
  }

  if (!Number.isInteger(ship.size) || ship.size <= 0) {
    return { success: false, error: "Invalid ship size" };
  }

  // Tính các ô mà tàu sẽ chiếm.
  const positions = [];

  for (let i = 0; i < ship.size; i++) {
    const row = orientation === "vertical" ? startRow + i : startRow;

    const col = orientation === "horizontal" ? startCol + i : startCol;

    // Không cho tàu vượt ra ngoài bàn cờ.
    if (row < 0 || col < 0 || row >= boardSize || col >= board[row].length) {
      return { success: false, error: "Ship is out of bounds" };
    }

    // Không cho tàu chồng lên tàu khác.
    if (board[row][col] !== null) {
      return { success: false, error: "Ship overlaps another ship" };
    }

    positions.push({ row, col });
  }

  // Chỉ cập nhật bàn cờ sau khi tất cả vị trí hợp lệ.
  for (const position of positions) {
    board[position.row][position.col] = ship.name;
  }

  ship.positions = positions;
  ship.hits = [];

  return { success: true, error: null };
}

module.exports = { placeShip };
