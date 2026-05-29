const { MongoMemoryServer } = require("mongodb-memory-server");
const fs   = require("fs");
const path = require("path");

const TEMP = path.join(__dirname, ".test-env.json");

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;

  fs.writeFileSync(
    TEMP,
    JSON.stringify({
      MONGO_URI: mongod.getUri(),
      MONGO_DB:  mongod.getUri(),
      JWT_KEY:   "medicarebook_test_jwt_secret_2024",
    })
  );
};
