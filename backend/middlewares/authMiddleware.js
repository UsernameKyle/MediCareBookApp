const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  /*
   * JWT_KEY is read INSIDE the function (lazy) so it is always evaluated
   * after process.env is populated — fixes the module-load timing bug in
   * test environments where env vars are set after require() calls.
   */
  const jwtKey = process.env.JWT_KEY;

  if (!jwtKey) {
    return res
      .status(500)
      .json({ message: "Server misconfiguration: JWT_KEY not set" });
  }

  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization header missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    const decoded = jwt.verify(token, jwtKey);

    /*
     * req.body may be undefined on GET requests when no body-parser has run.
     * Initialise it before writing so downstream controllers never crash.
     */
    if (!req.body || typeof req.body !== "object") {
      req.body = {};
    }

    req.body.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
