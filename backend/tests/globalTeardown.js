const fs   = require("fs");
const path = require("path");

const TEMP = path.join(__dirname, ".test-env.json");

module.exports = async () => {
  if (global.__MONGOD__) await global.__MONGOD__.stop();
  if (fs.existsSync(TEMP)) fs.unlinkSync(TEMP);
};
