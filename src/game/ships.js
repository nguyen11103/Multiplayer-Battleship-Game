const SHIP_TYPES = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

function createShips() {
  return SHIP_TYPES.map((ship) => ({
    name: ship.name,
    size: ship.size,
    positions: [],
    hits: [],
  }));
}

module.exports = {
  SHIP_TYPES,
  createShips,
};
