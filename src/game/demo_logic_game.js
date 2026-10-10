const { createBoard } = require("./board");
const { createShips } = require("./ships");
const { placeShip } = require("./placement");

console.log("=== BẮT ĐẦU CHẠY THỬ ==-\n");

// 1. Khởi tạo bàn cờ và danh sách tàu
const board = createBoard();
const ships = createShips();

console.log(`Đã tạo thành công ${ships.length} con tàu.\n`);

// 2. Thử đặt các con tàu
// Carrier (size 5) - Đặt ngang tại hàng 0, cột 0
let res1 = placeShip(board, ships[0], 0, 0, "horizontal");
console.log(
  `> Đặt ${ships[0].name}:`,
  res1.success ? "Thành công" : `Thất bại (${res1.error})`,
);

// Battleship (size 4) - Đặt dọc tại hàng 2, cột 2
let res2 = placeShip(board, ships[1], 2, 2, "vertical");
console.log(
  `> Đặt ${ships[1].name}:`,
  res2.success ? "Thành công" : `Thất bại (${res2.error})`,
);

// Cruiser (size 3) - Cố tình đặt đè vào vị trí (0, 1) đã có Carrier
let resFail = placeShip(board, ships[2], 0, 1, "vertical");
console.log(
  `> Đặt ${ships[2].name} (Cố tình đè):`,
  resFail.success ? "Thành công" : `Thất bại (${resFail.error})`,
);

// Destroyer (size 2) - Đặt ngang tại hàng 5, cột 5 thành công
let res3 = placeShip(board, ships[4], 5, 5, "horizontal");
console.log(
  `> Đặt ${ships[4].name}:`,
  res3.success ? "Thành công" : `Thất bại (${res3.error})`,
);
// Carrier (size 5) - Cố tình đặt ngoài bàn cờ
let res4 = placeShip(board, ships[0], 9, 9, "horizontal");
console.log(
  `> Đặt ${ships[0].name}:`,
  res4.success ? "Thành công" : `Thất bại (${res4.error})`,
);
// 3. In trạng thái bàn cờ ra màn hình console
console.log("\n=== TRẠNG THÁI BÀN CỜ HIỆN TẠI ===");
console.log("(Dấu '.' là ô trống, chữ cái đầu đại diện cho tên tàu)\n");

const visualBoard = board.map((row) =>
  row.map((cell) => (cell === null ? "." : cell[0])).join(" "),
);

console.log(visualBoard.join("\n"));
