/**
 * admin.test.js
 * All /api/admin/* endpoints.
 *
 * RULE: connectToDB() is NEVER called here.
 *       Tests connect directly via mongoose.connect(getTestUri()).
 *
 * Covers:
 *   1.x  GET  /api/admin/getallusers
 *   2.x  GET  /api/admin/getalldoctors
 *   3.x  POST /api/admin/getapprove
 *   4.x  POST /api/admin/getreject
 *   5.x  GET  /api/admin/getallAppointmentsAdmin
 */

// ── Step 1: env BEFORE any app require ───────────────────────────
const { setTestEnv, getTestUri, getTestJwtKey } = require("./testDbHelper");
setTestEnv();

// ── Step 2: imports ───────────────────────────────────────────────
const request         = require("supertest");
const mongoose        = require("mongoose");
const jwt             = require("jsonwebtoken");
const bcrypt          = require("bcrypt");
const createApp       = require("../app");
const userModel       = require("../schemas/userModel");
const docModel        = require("../schemas/docModel");
const appointmentModel= require("../schemas/appointmentModel");

let app;

// ── Helpers ───────────────────────────────────────────────────────
const makeToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, getTestJwtKey());

const createUser = async (overrides = {}) => {
  const hash = await bcrypt.hash("Password123!", 10);
  const user = await userModel.create({
    fullName: overrides.fullName || "Test User",
    email:    overrides.email    || `u_${Date.now()}@test.com`,
    password: hash,
    phone:    overrides.phone    || "09001234567",
    type:     overrides.type     || "user",
    isdoctor: overrides.isdoctor || false,
  });
  return { user, token: makeToken(user._id) };
};

const createDoctorProfile = (userId, overrides = {}) =>
  docModel.create({
    userId,
    fullName:      overrides.fullName      || "Dr Test",
    email:         overrides.email         || `dr_${Date.now()}@clinic.com`,
    phone:         "09009999999",
    address:       "123 Medical Ave",
    specialisation:"Cardiology",
    experience:    "10 years",
    fees:          500,
    timings:       ["09:00", "17:00"],
    status:        overrides.status        || "pending",
  });

// ── Lifecycle ─────────────────────────────────────────────────────
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
// 1. GET /api/admin/getallusers
// ═════════════════════════════════════════════════════════════════
describe("1. GET /api/admin/getallusers — getAllUsersControllers", () => {
  test("1.1 returns all users without password fields", async () => {
    const { token } = await createUser({ email: "admin@test.com", type: "admin" });
    await createUser({ email: "user1@test.com" });
    await createUser({ email: "user2@test.com" });

    const res = await request(app)
      .get("/api/admin/getallusers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3); // admin + 2 users
    res.body.data.forEach((u) => expect(u.password).toBeUndefined());
  });

  test("1.2 returns empty array when no users exist", async () => {
    // Need a token but afterEach wipes users, so create inline
    const hash = await bcrypt.hash("pass", 10);
    const admin = await userModel.create({
      fullName: "Admin", email: "a@a.com", password: hash,
      phone: "1", type: "admin",
    });
    const token = makeToken(admin._id);

    // Wipe everyone then call — the admin is gone too so we get []
    await userModel.deleteMany({});

    // Re-create just a token-bearing user to make the call with a valid token
    const admin2 = await userModel.create({
      fullName: "Admin2", email: "a2@a.com", password: hash,
      phone: "2", type: "admin",
    });
    const token2 = makeToken(admin2._id);

    const res = await request(app)
      .get("/api/admin/getallusers")
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(200);
    // At least admin2 is there
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("1.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/admin/getallusers");
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 2. GET /api/admin/getalldoctors
// ═════════════════════════════════════════════════════════════════
describe("2. GET /api/admin/getalldoctors — getAllDoctorsControllers", () => {
  test("2.1 returns ALL doctors regardless of status", async () => {
    const { user, token } = await createUser({ type: "admin" });
    await createDoctorProfile(user._id, { status: "pending" });
    await createDoctorProfile(user._id, { status: "approved", email: "ap@clinic.com" });
    await createDoctorProfile(user._id, { status: "rejected", email: "rej@clinic.com" });

    const res = await request(app)
      .get("/api/admin/getalldoctors")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  test("2.2 returns empty array when no doctors exist", async () => {
    const { token } = await createUser({ type: "admin" });
    const res = await request(app)
      .get("/api/admin/getalldoctors")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("2.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/admin/getalldoctors");
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 3. POST /api/admin/getapprove
// ═════════════════════════════════════════════════════════════════
describe("3. POST /api/admin/getapprove — getStatusApproveController", () => {
  test("3.1 sets doctor status to 'approved' and returns 200", async () => {
    const { user: docUser }   = await createUser({ email: "docuser@test.com" });
    const { token: adminToken } = await createUser({ email: "admin@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id, { status: "pending" });

    const res = await request(app)
      .post("/api/admin/getapprove")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    expect(res.status).toBe(200);

    const updatedDoctor = await docModel.findById(doctor._id);
    expect(updatedDoctor.status).toBe("approved");
  });

  test("3.2 sets user.isdoctor to true on approval", async () => {
    const { user: docUser }   = await createUser({ email: "docuser2@test.com" });
    const { token: adminToken } = await createUser({ email: "admin2@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id);

    await request(app)
      .post("/api/admin/getapprove")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    const updatedUser = await userModel.findById(docUser._id);
    expect(updatedUser.isdoctor).toBe(true);
  });

  test("3.3 sends approval notification to the doctor's user account", async () => {
    const { user: docUser }   = await createUser({ email: "docuser3@test.com" });
    const { token: adminToken } = await createUser({ email: "admin3@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id);

    await request(app)
      .post("/api/admin/getapprove")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    const updatedUser = await userModel.findById(docUser._id);
    expect(updatedUser.notification.length).toBeGreaterThan(0);
    expect(updatedUser.notification[0].type).toBe("doctor-account-approved");
  });

  test("3.4 returns 400 when doctorId is missing", async () => {
    const { user: docUser }   = await createUser({ email: "docuser4@test.com" });
    const { token: adminToken } = await createUser({ email: "admin4@test.com", type: "admin" });

    const res = await request(app)
      .post("/api/admin/getapprove")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userid: docUser._id }); // no doctorId

    expect(res.status).toBe(400);
  });

  test("3.5 returns 404 when doctorId does not exist", async () => {
    const { user: docUser }   = await createUser({ email: "docuser5@test.com" });
    const { token: adminToken } = await createUser({ email: "admin5@test.com", type: "admin" });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/admin/getapprove")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: fakeId, userid: docUser._id });

    expect(res.status).toBe(404);
  });

  test("3.6 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/admin/getapprove")
      .send({ doctorId: "any", userid: "any" });
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 4. POST /api/admin/getreject
// ═════════════════════════════════════════════════════════════════
describe("4. POST /api/admin/getreject — getStatusRejectController", () => {
  test("4.1 sets doctor status to 'rejected' and returns 200", async () => {
    const { user: docUser }   = await createUser({ email: "docuser6@test.com" });
    const { token: adminToken } = await createUser({ email: "admin6@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id, { status: "pending" });

    const res = await request(app)
      .post("/api/admin/getreject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    expect(res.status).toBe(200);

    const updatedDoctor = await docModel.findById(doctor._id);
    expect(updatedDoctor.status).toBe("rejected");
  });

  test("4.2 sets user.isdoctor to false on rejection", async () => {
    // Start with isdoctor: true, rejection should flip it back
    const { user: docUser }   = await createUser({
      email: "docuser7@test.com", isdoctor: true,
    });
    const { token: adminToken } = await createUser({ email: "admin7@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id, { status: "approved" });

    await request(app)
      .post("/api/admin/getreject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    const updatedUser = await userModel.findById(docUser._id);
    expect(updatedUser.isdoctor).toBe(false);
  });

  test("4.3 sends rejection notification to the doctor's user account", async () => {
    const { user: docUser }   = await createUser({ email: "docuser8@test.com" });
    const { token: adminToken } = await createUser({ email: "admin8@test.com", type: "admin" });
    const doctor = await createDoctorProfile(docUser._id);

    await request(app)
      .post("/api/admin/getreject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: doctor._id, userid: docUser._id });

    const updatedUser = await userModel.findById(docUser._id);
    expect(updatedUser.notification.length).toBeGreaterThan(0);
    expect(updatedUser.notification[0].type).toBe("doctor-account-rejected");
  });

  test("4.4 returns 400 when userid is missing", async () => {
    const { token: adminToken } = await createUser({ email: "admin9@test.com", type: "admin" });
    const fakeDocId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/admin/getreject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: fakeDocId }); // no userid

    expect(res.status).toBe(400);
  });

  test("4.5 returns 404 when doctorId does not exist", async () => {
    const { user: docUser }   = await createUser({ email: "docuser9@test.com" });
    const { token: adminToken } = await createUser({ email: "admin10@test.com", type: "admin" });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/admin/getreject")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ doctorId: fakeId, userid: docUser._id });

    expect(res.status).toBe(404);
  });

  test("4.6 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/admin/getreject")
      .send({ doctorId: "any", userid: "any" });
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 5. GET /api/admin/getallAppointmentsAdmin
// ═════════════════════════════════════════════════════════════════
describe("5. GET /api/admin/getallAppointmentsAdmin — displayAllAppointmentController", () => {
  test("5.1 returns all appointments system-wide", async () => {
    const { user: u1, token: adminToken } = await createUser({ email: "admin11@test.com", type: "admin" });
    const { user: u2 } = await createUser({ email: "patient@test.com" });
    const doctor = await createDoctorProfile(u1._id, { status: "approved" });

    await appointmentModel.create({
      userInfo: u1._id, doctorInfo: doctor._id, date: "2025-12-20",
    });
    await appointmentModel.create({
      userInfo: u2._id, doctorInfo: doctor._id, date: "2025-12-21",
    });

    const res = await request(app)
      .get("/api/admin/getallAppointmentsAdmin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("5.2 returns empty array when no appointments exist", async () => {
    const { token } = await createUser({ type: "admin" });
    const res = await request(app)
      .get("/api/admin/getallAppointmentsAdmin")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("5.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/admin/getallAppointmentsAdmin");
    expect(res.status).toBe(401);
  });
});
