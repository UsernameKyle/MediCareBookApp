const fs   = require("fs");
const path = require("path");

const TEMP = path.join(__dirname, ".test-env.json");

const getTestEnv = () => {
  if (!fs.existsSync(TEMP)) {
    throw new Error("Test env file missing — did globalSetup run?");
  }
  return JSON.parse(fs.readFileSync(TEMP, "utf8"));
};

/*
 * Call setTestEnv() as the VERY FIRST THING in every test file —
 * before any require() that touches app code — so process.env is
 * populated before any module caches a value from it.
 */
const setTestEnv = () => {
  const env = getTestEnv();
  process.env.MONGO_URI = env.MONGO_URI;
  process.env.MONGO_DB  = env.MONGO_DB;
  process.env.JWT_KEY   = env.JWT_KEY;
};

const getTestUri    = () => getTestEnv().MONGO_URI;
const getTestJwtKey = () => getTestEnv().JWT_KEY;

module.exports = { setTestEnv, getTestUri, getTestJwtKey };
