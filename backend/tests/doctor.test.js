/**
 * doctor.test.js
 * All /api/doctor/* endpoints.
 *
 * RULE: connectToDB() is NEVER called here.
 *       Tests connect directly via mongoose.connect(getTestUri()).
 *
 * Covers:
 *   1.x  POST /api/doctor/updateprofile
 *   2.x  GET  /api/doctor/getdoctorappointments
 *   3.x  POST /api/doctor/handlestatus
 *   4.x  GET  /api/doctor/getdocumentdownload
 */

// ── Step 1: env BEFORE any app require ───────────────────────────
const { setTestEnv, getTestUri, getTestJwtKey } = require("./testDbHelper");
setTestEnv();

// ── Step 2: imports ───────────────────────────────────────────────
const request         = require("supertest");
const mongoose        = require("mongoose");
const jwt             = require("jsonwebtoken");
const bcrypt          = require("bcrypt");
const fs              = require("fs");
const path            = require("path");
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
    fullName:       overrides.fullName       || "Dr Test",
    email:          overrides.email          || `dr_${Date.now()}@clinic.com`,
    phone:          overrides.phone          || "09009999999",
    address:        overrides.address        || "123 Medical Ave",
    specialisation: overrides.specialisation || "Cardiology",
    experience:     overrides.experience     || "10 years",
    fees:           overrides.fees           || 500,
    timings:        overrides.timings        || ["09:00", "17:00"],
    status:         overrides.status         || "approved",
  });

// Valid profile payload for update tests
const validProfilePayload = {
  fullName:       "Dr Updated Name",
  email:          "updated@clinic.com",
  phone:          "09001112233",
  address:        "999 New St",
  specialisation: "Neurology",
  experience:     "12 years",
  fees:           800,
  timings:        ["08:00", "16:00"],
};

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
// 1. POST /api/doctor/updateprofile
// ═════════════════════════════════════════════════════════════════
describe("1. POST /api/doctor/updateprofile — updateDoctorProfileController", () => {
  test("1.1 updates doctor profile and returns 200", async () => {
    const { user, token } = await createUser();
    await createDoctorProfile(user._id);

    const res = await request(app)
      .post("/api/doctor/updateprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(validProfilePayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  test("1.2 persists updated fields to the database", async () => {
    const { user, token } = await createUser();
    await createDoctorProfile(user._id);

    await request(app)
      .post("/api/doctor/updateprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(validProfilePayload);

    const updated = await docModel.findOne({ userId: user._id });
    expect(updated.specialisation).toBe("Neurology");
    expect(updated.fees).toBe(800);
    expect(updated.experience).toBe("12 years");
  });

  test("1.3 returns 404 when user has no doctor profile", async () => {
    const { token } = await createUser({ email: "nodoc@test.com" });

    const res = await request(app)
      .post("/api/doctor/updateprofile")
      .set("Authorization", `Bearer ${token}`)
      .send(validProfilePayload);

    expect(res.status).toBe(404);
  });

  test("1.4 returns 400 when required fields are missing", async () => {
    const { user, token } = await createUser();
    await createDoctorProfile(user._id);

    const res = await request(app)
      .post("/api/doctor/updateprofile")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Incomplete" }); // missing most fields

    expect(res.status).toBe(400);
  });

  test("1.5 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/doctor/updateprofile")
      .send(validProfilePayload);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 2. GET /api/doctor/getdoctorappointments
// ═════════════════════════════════════════════════════════════════
describe("2. GET /api/doctor/getdoctorappointments — getAllDoctorAppointmentsController", () => {
  test("2.1 returns only appointments belonging to the logged-in doctor", async () => {
    const { user: docUser1, token: token1 } = await createUser({ email: "doc1@test.com" });
    const { user: docUser2 }                = await createUser({ email: "doc2@test.com" });
    const { user: patient }                 = await createUser({ email: "patient@test.com" });

    const doctor1 = await createDoctorProfile(docUser1._id);
    const doctor2 = await createDoctorProfile(docUser2._id, { email: "dr2@clinic.com" });

    // One appointment for doctor1, one for doctor2
    await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor1._id, date: "2025-12-20",
    });
    await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor2._id, date: "2025-12-21",
    });

    const res = await request(app)
      .get("/api/doctor/getdoctorappointments")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].doctorInfo.toString()).toBe(doctor1._id.toString());
  });

  test("2.2 returns empty array when doctor has no appointments", async () => {
    const { user, token } = await createUser();
    await createDoctorProfile(user._id);

    const res = await request(app)
      .get("/api/doctor/getdoctorappointments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("2.3 returns 404 when user has no doctor profile", async () => {
    const { token } = await createUser({ email: "nodoc2@test.com" });

    const res = await request(app)
      .get("/api/doctor/getdoctorappointments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("2.4 returns 401 without token", async () => {
    const res = await request(app).get("/api/doctor/getdoctorappointments");
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 3. POST /api/doctor/handlestatus
// ═════════════════════════════════════════════════════════════════
describe("3. POST /api/doctor/handlestatus — handleStatusController", () => {
  test("3.1 approves an appointment and returns 200", async () => {
    const { user: docUser, token } = await createUser({ email: "doc3@test.com" });
    const { user: patient }        = await createUser({ email: "patient2@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor._id, date: "2025-12-22",
    });

    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: appt._id, status: "approved" });

    expect(res.status).toBe(200);

    const updated = await appointmentModel.findById(appt._id);
    expect(updated.status).toBe("approved");
  });

  test("3.2 rejects an appointment and returns 200", async () => {
    const { user: docUser, token } = await createUser({ email: "doc4@test.com" });
    const { user: patient }        = await createUser({ email: "patient3@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor._id, date: "2025-12-23",
    });

    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: appt._id, status: "rejected" });

    expect(res.status).toBe(200);

    const updated = await appointmentModel.findById(appt._id);
    expect(updated.status).toBe("rejected");
  });

  test("3.3 notifies the patient when appointment is approved", async () => {
    const { user: docUser, token } = await createUser({ email: "doc5@test.com" });
    const { user: patient }        = await createUser({ email: "patient4@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor._id, date: "2025-12-24",
    });

    await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: appt._id, status: "approved" });

    const updatedPatient = await userModel.findById(patient._id);
    expect(updatedPatient.notification.length).toBeGreaterThan(0);
    expect(updatedPatient.notification[0].type).toBe("appointment-approved");
  });

  test("3.4 notifies the patient when appointment is rejected", async () => {
    const { user: docUser, token } = await createUser({ email: "doc6@test.com" });
    const { user: patient }        = await createUser({ email: "patient5@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor._id, date: "2025-12-25",
    });

    await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: appt._id, status: "rejected" });

    const updatedPatient = await userModel.findById(patient._id);
    expect(updatedPatient.notification[0].type).toBe("appointment-rejected");
  });

  test("3.5 returns 400 when status value is invalid", async () => {
    const { token } = await createUser({ email: "doc7@test.com" });
    const fakeId    = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: fakeId, status: "unknown" });

    expect(res.status).toBe(400);
  });

  test("3.6 returns 400 when appointmentId is missing", async () => {
    const { token } = await createUser({ email: "doc8@test.com" });

    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });

    expect(res.status).toBe(400);
  });

  test("3.7 returns 404 when appointmentId does not exist", async () => {
    const { token } = await createUser({ email: "doc9@test.com" });
    const fakeId    = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .set("Authorization", `Bearer ${token}`)
      .send({ appointmentId: fakeId, status: "approved" });

    expect(res.status).toBe(404);
  });

  test("3.8 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/doctor/handlestatus")
      .send({ appointmentId: "any", status: "approved" });
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 4. GET /api/doctor/getdocumentdownload
// ═════════════════════════════════════════════════════════════════
describe("4. GET /api/doctor/getdocumentdownload — documentDownloadController", () => {
  let tempFilePath;

  beforeEach(() => {
    // Create a real temp file so res.download() has something to stream
    tempFilePath = path.join(__dirname, `test_doc_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, "fake pdf content for testing");
  });

  afterEach(async () => {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    await userModel.deleteMany({});
    await docModel.deleteMany({});
    await appointmentModel.deleteMany({});
  });

  test("4.1 streams the file and returns 200 when document exists", async () => {
    const { user: docUser, token } = await createUser({ email: "doc10@test.com" });
    const { user: patient }        = await createUser({ email: "patient6@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo:   patient._id,
      doctorInfo: doctor._id,
      date:       "2025-12-26",
      document:   { path: tempFilePath },
    });

    const res = await request(app)
      .get(`/api/doctor/getdocumentdownload?appointId=${appt._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("4.2 returns 400 when appointId query param is missing", async () => {
    const { token } = await createUser({ email: "doc11@test.com" });

    const res = await request(app)
      .get("/api/doctor/getdocumentdownload")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test("4.3 returns 404 when appointId does not match any appointment", async () => {
    const { token } = await createUser({ email: "doc12@test.com" });
    const fakeId    = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/doctor/getdocumentdownload?appointId=${fakeId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("4.4 returns 409 when appointment has no document attached", async () => {
    const { user: docUser, token } = await createUser({ email: "doc13@test.com" });
    const { user: patient }        = await createUser({ email: "patient7@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo: patient._id, doctorInfo: doctor._id, date: "2025-12-27",
      // no document field
    });

    const res = await request(app)
      .get(`/api/doctor/getdocumentdownload?appointId=${appt._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
  });

  test("4.5 returns 404 when file path in DB no longer exists on disk", async () => {
    const { user: docUser, token } = await createUser({ email: "doc14@test.com" });
    const { user: patient }        = await createUser({ email: "patient8@test.com" });
    const doctor = await createDoctorProfile(docUser._id);
    const appt   = await appointmentModel.create({
      userInfo:   patient._id,
      doctorInfo: doctor._id,
      date:       "2025-12-28",
      document:   { path: "/nonexistent/path/ghost_file.pdf" },
    });

    const res = await request(app)
      .get(`/api/doctor/getdocumentdownload?appointId=${appt._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test("4.6 returns 401 without token", async () => {
    const res = await request(app).get("/api/doctor/getdocumentdownload?appointId=any");
    expect(res.status).toBe(401);
  });
});
