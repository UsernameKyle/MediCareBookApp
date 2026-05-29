/**
 * foundation.test.js
 * Validates core scaffolding: env, DB connectivity, schemas, app factory.
 *
 * RULE: connectToDB() is NEVER called here.
 *       Tests connect directly via mongoose.connect(getTestUri()).
 */

// ── Step 1: env BEFORE any app require ───────────────────────────
const { setTestEnv, getTestUri } = require("./testDbHelper");
setTestEnv();

// ── Step 2: app imports ───────────────────────────────────────────
const mongoose        = require("mongoose");
const request         = require("supertest");
const bcrypt          = require("bcrypt");
const createApp       = require("../app");
const userModel       = require("../schemas/userModel");
const docModel        = require("../schemas/docModel");
const appointmentModel= require("../schemas/appointmentModel");

let app;

beforeAll(async () => {
  await mongoose.connect(getTestUri());
  app = createApp();
});

afterEach(async () => {
  await userModel.deleteMany({});
  await docModel.deleteMany({});
  await appointmentModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

// ═════════════════════════════════════════════════════════════════
// 1. Environment
// ═════════════════════════════════════════════════════════════════
describe("1. Environment", () => {
  test("1.1 MONGO_URI is set", () => {
    expect(process.env.MONGO_URI).toBeTruthy();
  });

  test("1.2 JWT_KEY is set", () => {
    expect(process.env.JWT_KEY).toBeTruthy();
  });

  test("1.3 Mongoose connection is ready (state === 1)", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  test("1.4 Can write and read a document", async () => {
    const hash = await bcrypt.hash("pass", 10);
    await userModel.create({
      fullName: "Found User",
      email:    "found@test.com",
      password: hash,
      phone:    "09001234567",
    });
    const doc = await userModel.findOne({ email: "found@test.com" });
    expect(doc).not.toBeNull();
    expect(doc.fullName).toBe("Found User");
  });
});

// ═════════════════════════════════════════════════════════════════
// 2. User schema
// ═════════════════════════════════════════════════════════════════
describe("2. User schema", () => {
  test("2.1 requires fullName", async () => {
    const hash = await bcrypt.hash("pass", 10);
    await expect(
      userModel.create({ email: "a@b.com", password: hash, phone: "123" })
    ).rejects.toThrow();
  });

  test("2.2 requires email", async () => {
    const hash = await bcrypt.hash("pass", 10);
    await expect(
      userModel.create({ fullName: "No Email", password: hash, phone: "123" })
    ).rejects.toThrow();
  });

  test("2.3 type defaults to 'user'", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Default", email: "def@test.com", password: hash, phone: "111",
    });
    expect(u.type).toBe("user");
  });

  test("2.4 isdoctor defaults to false", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Doc?", email: "doc@test.com", password: hash, phone: "222",
    });
    expect(u.isdoctor).toBe(false);
  });

  test("2.5 notification and seennotification default to []", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Notif", email: "notif@test.com", password: hash, phone: "333",
    });
    expect(u.notification).toEqual([]);
    expect(u.seennotification).toEqual([]);
  });

  test("2.6 email stored lowercase", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Case", email: "UPPER@TEST.COM", password: hash, phone: "444",
    });
    expect(u.email).toBe("upper@test.com");
  });

  test("2.7 fullName auto-capitalised", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "juan dela cruz", email: "juan@test.com", password: hash, phone: "555",
    });
    expect(u.fullName).toBe("Juan Dela Cruz");
  });
});

// ═════════════════════════════════════════════════════════════════
// 3. Doctor schema
// ═════════════════════════════════════════════════════════════════
describe("3. Doctor schema", () => {
  test("3.1 requires userId", async () => {
    await expect(
      docModel.create({
        fullName: "Dr X", email: "x@x.com", phone: "1",
        address: "a", specialisation: "s", experience: "1yr",
        fees: 100, timings: ["09:00", "17:00"],
      })
    ).rejects.toThrow();
  });

  test("3.2 status defaults to 'pending'", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Owner", email: "owner@test.com", password: hash, phone: "666",
    });
    const d = await docModel.create({
      userId: u._id, fullName: "Dr Pend", email: "pend@test.com",
      phone: "777", address: "1 St", specialisation: "ENT",
      experience: "2yr", fees: 200, timings: ["08:00", "16:00"],
    });
    expect(d.status).toBe("pending");
  });
});

// ═════════════════════════════════════════════════════════════════
// 4. Appointment schema
// ═════════════════════════════════════════════════════════════════
describe("4. Appointment schema", () => {
  test("4.1 status defaults to 'pending'", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Appt U", email: "apptu@test.com", password: hash, phone: "888",
    });
    const d = await docModel.create({
      userId: u._id, fullName: "Dr Appt", email: "drappt@test.com",
      phone: "999", address: "2 St", specialisation: "Ortho",
      experience: "3yr", fees: 300, timings: ["09:00", "17:00"],
    });
    const a = await appointmentModel.create({
      userInfo: u._id, doctorInfo: d._id, date: "2025-12-25",
    });
    expect(a.status).toBe("pending");
  });

  test("4.2 requires userInfo", async () => {
    const hash = await bcrypt.hash("pass", 10);
    const u = await userModel.create({
      fullName: "Req U", email: "requ@test.com", password: hash, phone: "000",
    });
    const d = await docModel.create({
      userId: u._id, fullName: "Dr Req", email: "drreq@test.com",
      phone: "001", address: "3 St", specialisation: "Cardio",
      experience: "4yr", fees: 400, timings: ["09:00", "17:00"],
    });
    await expect(
      appointmentModel.create({ doctorInfo: d._id, date: "2025-12-26" })
    ).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════
// 5. App factory
// ═════════════════════════════════════════════════════════════════
describe("5. App factory", () => {
  test("5.1 createApp() returns a function", () => {
    expect(typeof app).toBe("function");
  });

  test("5.2 unknown route returns 404", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });

  test("5.3 POST /api/user/register exists", async () => {
    const res = await request(app).post("/api/user/register").send({});
    expect(res.status).toBe(400); // bad input, not 404
  });

  test("5.4 POST /api/user/login exists", async () => {
    const res = await request(app).post("/api/user/login").send({});
    expect(res.status).toBe(400);
  });

  test("5.5 POST /api/user/getuserdata is protected", async () => {
    const res = await request(app).post("/api/user/getuserdata").send({});
    expect(res.status).toBe(401);
  });

  test("5.6 CORS header present on responses", async () => {
    const res = await request(app).post("/api/user/getuserdata").send({});
    expect(res.headers["access-control-allow-origin"]).toBeDefined();
  });
});
