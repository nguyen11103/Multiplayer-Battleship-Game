function isValidCoordinate(board, row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    col >= 0 &&
    row < board.length &&
    col < board[row].length
  );
}

function sameCoordinate(a, b) {
  return a.row === b.row && a.col === b.col;
}

function isShipSunk(ship) {
  return (
    ship.positions.length > 0 &&
    ship.positions.every((position) =>
      ship.hits.some((hit) => sameCoordinate(hit, position)),
    )
  );
}

function fireShot(board, ships, shots, row, col) {
  // 1. Kiểm tra tọa độ.
  if (!isValidCoordinate(board, row, col)) {
    return {
      success: false,
      error: "Invalid coordinate",
    };
  }

  // 2. Không cho bắn vào ô đã bắn trước đó.
  const key = `${row},${col}`;

  if (shots.has(key)) {
    return {
      success: false,
      error: "Cell has already been targeted",
    };
  }

  // 3. Xác định ô có tàu hay không.
  const target = board[row][col];

  let hitShip = null;

  if (target !== null) {
    hitShip = ships.find((ship) => ship.name === target);

    if (!hitShip) {
      return {
        success: false,
        error: "Invalid board state",
      };
    }
  }

  // 4. Ghi nhận phát bắn hợp lệ.
  shots.add(key);

  // 5. Nếu trúng tàu, ghi nhận tọa độ trúng.
  if (hitShip) {
    hitShip.hits.push({ row, col });
  }

  // 6. Kiểm tra tàu vừa bị phá hủy.
  const sunkShip = hitShip && isShipSunk(hitShip) ? hitShip : null;

  // 7. Kiểm tra toàn bộ tàu đã bị phá hủy chưa.
  const gameOver = ships.length > 0 && ships.every(isShipSunk);

  return {
    success: true,
    result: hitShip ? "hit" : "miss",
    sunk: sunkShip ? sunkShip.name : null,
    gameOver,
  };
}

module.exports = {
  fireShot,
  isShipSunk,
  isValidCoordinate,
};
