const BOARD_SIZE = 10;

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}
module.exports = {
  BOARD_SIZE,
  createBoard,
};
