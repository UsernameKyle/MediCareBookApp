const dotenv     = require("dotenv");
dotenv.config();

const connectToDB = require("./config/connectToDB");
const createApp   = require("./app");

const PORT = process.env.PORT || 8001;

connectToDB().then(() => {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
