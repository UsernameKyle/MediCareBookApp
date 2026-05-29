/**
 * auth_user_public.test.js
 * Public endpoints + auth middleware guard.
 *
 * RULE: connectToDB() is NEVER called here.
 *       Tests connect directly via mongoose.connect(getTestUri()).
 */

// ── Step 1: env BEFORE any app require ───────────────────────────
const { setTestEnv, getTestUri, getTestJwtKey } = require("./testDbHelper");
setTestEnv();

// ── Step 2: app imports ───────────────────────────────────────────
const request   = require("supertest");
const mongoose  = require("mongoose");
const jwt       = require("jsonwebtoken");
const bcrypt    = require("bcrypt");
const createApp = require("../app");
const userModel = require("../schemas/userModel");

let app;

// ── Helpers ───────────────────────────────────────────────────────
const registerPayload = (overrides = {}) => ({
  fullName: "Test User",
  email:    "test@example.com",
  password: "SecurePass123",
  phone:    "09001234567",
  type:     "user",
  ...overrides,
});

beforeAll(async () => {
  await mongoose.connect(getTestUri());
  app = createApp();
});

afterEach(async () => {
  await userModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ═════════════════════════════════════════════════════════════════
// Group 1 — Auth Middleware
// ═════════════════════════════════════════════════════════════════
describe("Group 1 — Auth Middleware", () => {
  test("1.1 — no Authorization header returns 401", async () => {
    const res = await request(app).post("/api/user/getuserdata");
    expect(res.status).toBe(401);
  });

  test("1.2 — malformed header (no Bearer prefix) returns 401", async () => {
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", "InvalidTokenWithNoBearer");
    expect(res.status).toBe(401);
  });

  test("1.3 — tampered/invalid token returns 401", async () => {
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", "Bearer this.is.a.tampered.token");
    expect(res.status).toBe(401);
  });

  test("1.4 — valid token reaches the route (returns non-401)", async () => {
    const hash = await bcrypt.hash("SecurePass123", 10);
    const user = await userModel.create({
      fullName: "Valid Token User",
      email:    "validtoken@test.com",
      password: hash,
      phone:    "09001234567",
    });
    const token = jwt.sign(
      { userId: user._id.toString() },
      getTestJwtKey()
    );

    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(user._id.toString());
  });

  test("1.5 — expired token returns 401", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      {
        userId: new mongoose.Types.ObjectId().toString(),
        iat: nowSec - 7200,
        exp: nowSec - 3600,
      },
      getTestJwtKey()
    );
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// Group 2 — POST /api/user/register
// ═════════════════════════════════════════════════════════════════
describe("Group 2 — POST /api/user/register", () => {
  test("2.1 — valid payload returns 201", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .send(registerPayload());
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
  });

  test("2.2 — missing email returns 400", async () => {
    const { email, ...payload } = registerPayload();
    const res = await request(app).post("/api/user/register").send(payload);
    expect(res.status).toBe(400);
  });

  test("2.3 — missing password returns 400", async () => {
    const { password, ...payload } = registerPayload();
    const res = await request(app).post("/api/user/register").send(payload);
    expect(res.status).toBe(400);
  });

  test("2.4 — missing fullName returns 400", async () => {
    const { fullName, ...payload } = registerPayload();
    const res = await request(app).post("/api/user/register").send(payload);
    expect(res.status).toBe(400);
  });

  test("2.5 — duplicate email returns 409", async () => {
    await request(app).post("/api/user/register").send(registerPayload());
    const res = await request(app)
      .post("/api/user/register")
      .send(registerPayload());
    expect(res.status).toBe(409);
  });

  test("2.6 — response body never contains a password field", async () => {
    const res = await request(app)
      .post("/api/user/register")
      .send(registerPayload());
    expect(res.body.password).toBeUndefined();
  });

  test("2.7 — stored password is bcrypt-hashed not plaintext", async () => {
    await request(app).post("/api/user/register").send(registerPayload());
    const dbUser = await userModel.findOne({ email: "test@example.com" });
    expect(dbUser.password).not.toBe("SecurePass123");
    expect(dbUser.password).toMatch(/^\$2[ab]\$/);
  });

  test("2.8 — email stored lowercase regardless of input casing", async () => {
    await request(app)
      .post("/api/user/register")
      .send(registerPayload({ email: "TEST@EXAMPLE.COM" }));
    const dbUser = await userModel.findOne({ email: "test@example.com" });
    expect(dbUser).not.toBeNull();
    expect(dbUser.email).toBe("test@example.com");
  });
});

// ═════════════════════════════════════════════════════════════════
// Group 3 — POST /api/user/login
// ═════════════════════════════════════════════════════════════════
describe("Group 3 — POST /api/user/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/user/register").send(registerPayload());
  });

  test("3.1 — valid credentials return 200 + token + userData", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "test@example.com", password: "SecurePass123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userData).toBeDefined();
  });

  test("3.2 — wrong password returns 401", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "test@example.com", password: "WrongPassword" });
    expect(res.status).toBe(401);
  });

  test("3.3 — unknown email returns 404", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "nobody@test.com", password: "AnyPass" });
    expect(res.status).toBe(404);
  });

  test("3.4 — missing email returns 400", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ password: "SecurePass123" });
    expect(res.status).toBe(400);
  });

  test("3.5 — missing password returns 400", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "test@example.com" });
    expect(res.status).toBe(400);
  });

  test("3.6 — userData does not contain password field", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "test@example.com", password: "SecurePass123" });
    expect(res.status).toBe(200);
    expect(res.body.userData.password).toBeUndefined();
  });

  test("3.7 — returned JWT decodes to correct userId", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "test@example.com", password: "SecurePass123" });
    const { token, userData } = res.body;
    const decoded = jwt.verify(token, getTestJwtKey());
    expect(decoded.userId.toString()).toBe(userData._id.toString());
  });
});
