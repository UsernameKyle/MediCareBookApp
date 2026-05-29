/**
 * user_protected.test.js
 * All protected /api/user/* endpoints.
 *
 * RULE: connectToDB() is NEVER called here.
 *       Tests connect directly via mongoose.connect(getTestUri()).
 */

// ── Step 1: env BEFORE any app require ───────────────────────────
const { setTestEnv, getTestUri, getTestJwtKey } = require("./testDbHelper");
setTestEnv();

// ── Step 2: app imports ───────────────────────────────────────────
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
  });
  return { user, token: makeToken(user._id) };
};

const createApprovedDoctor = (userId) =>
  docModel.create({
    userId,
    fullName:      "Dr Jane Smith",
    email:         "jane@clinic.com",
    phone:         "09009999999",
    address:       "123 Medical Ave",
    specialisation:"Cardiology",
    experience:    "10 years",
    fees:          500,
    timings:       ["09:00", "17:00"],
    status:        "approved",
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
// 1. authMiddleware on protected routes
// ═════════════════════════════════════════════════════════════════
describe("1. authMiddleware — token guard", () => {
  test("1.1 returns 401 when Authorization header is absent", async () => {
    const res = await request(app).post("/api/user/getuserdata").send({});
    expect(res.status).toBe(401);
  });

  test("1.2 returns 401 when header is not Bearer scheme", async () => {
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", "Basic abc123")
      .send({});
    expect(res.status).toBe(401);
  });

  test("1.3 returns 401 for a tampered token", async () => {
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", "Bearer not.a.real.token")
      .send({});
    expect(res.status).toBe(401);
  });

  test("1.4 valid token reaches the route and returns 200", async () => {
    const { user, token } = await createUser();
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data._id.toString()).toBe(user._id.toString());
  });
});

// ═════════════════════════════════════════════════════════════════
// 2. POST /api/user/getuserdata
// ═════════════════════════════════════════════════════════════════
describe("2. POST /api/user/getuserdata — authController", () => {
  test("2.1 returns user data without password", async () => {
    const { user, token } = await createUser({ fullName: "Alice Reyes" });
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Alice Reyes");
    expect(res.body.data.password).toBeUndefined();
  });

  test("2.2 returns 404 for token with non-existent userId", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const token  = makeToken(fakeId);
    const res = await request(app)
      .post("/api/user/getuserdata")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });

  test("2.3 returns 401 without token", async () => {
    const res = await request(app).post("/api/user/getuserdata").send({});
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 3. POST /api/user/registerdoc
// ═════════════════════════════════════════════════════════════════
describe("3. POST /api/user/registerdoc — docController", () => {
  const docPayload = {
    fullName:      "Dr Carlos Mendez",
    email:         "carlos@clinic.com",
    phone:         "09001112222",
    address:       "456 Health St",
    specialisation:"Dermatology",
    experience:    "5 years",
    fees:          300,
    timings:       ["08:00", "16:00"],
  };

  test("3.1 creates a pending application and returns 201", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send(docPayload);
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/submitted/i);
  });

  test("3.2 new application has status 'pending'", async () => {
    const { user, token } = await createUser();
    await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send(docPayload);
    const doc = await docModel.findOne({ userId: user._id });
    expect(doc).not.toBeNull();
    expect(doc.status).toBe("pending");
  });

  test("3.3 notifies admin users on submission", async () => {
    const { user: admin } = await createUser({
      type: "admin", email: "admin@test.com",
    });
    const { token } = await createUser({ email: "applicant@test.com" });
    await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send(docPayload);
    const updatedAdmin = await userModel.findById(admin._id);
    expect(updatedAdmin.notification.length).toBeGreaterThan(0);
    expect(updatedAdmin.notification[0].type).toBe("doctor-application");
  });

  test("3.4 returns 409 on duplicate application", async () => {
    const { token } = await createUser();
    await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send(docPayload);
    const res = await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send(docPayload);
    expect(res.status).toBe(409);
  });

  test("3.5 returns 400 when required fields are missing", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/user/registerdoc")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Incomplete" });
    expect(res.status).toBe(400);
  });

  test("3.6 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/user/registerdoc")
      .send(docPayload);
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 4. GET /api/user/getalldoctorsu
// ═════════════════════════════════════════════════════════════════
describe("4. GET /api/user/getalldoctorsu — getAllDoctorsControllers", () => {
  test("4.1 returns only approved doctors", async () => {
    const { user, token } = await createUser();
    await createApprovedDoctor(user._id);
    await docModel.create({
      userId: user._id, fullName: "Dr Pending", email: "pend@clinic.com",
      phone: "1", address: "1", specialisation: "ENT",
      experience: "1yr", fees: 100, timings: ["09:00", "12:00"],
      status: "pending",
    });
    const res = await request(app)
      .get("/api/user/getalldoctorsu")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe("approved");
  });

  test("4.2 returns empty array when no approved doctors", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/user/getalldoctorsu")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("4.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/user/getalldoctorsu");
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 5. POST /api/user/getappointment
// ═════════════════════════════════════════════════════════════════
describe("5. POST /api/user/getappointment — appointmentController", () => {
  test("5.1 books an appointment and returns 201", async () => {
    const { user, token } = await createUser();
    const doctor = await createApprovedDoctor(user._id);
    const res = await request(app)
      .post("/api/user/getappointment")
      .set("Authorization", `Bearer ${token}`)
      .field("userInfo",   JSON.stringify(user._id))
      .field("doctorInfo", JSON.stringify(doctor._id))
      .field("date",       "2025-12-25 10:00");
    expect(res.status).toBe(201);
  });

  test("5.2 created appointment has status 'pending'", async () => {
    const { user, token } = await createUser();
    const doctor = await createApprovedDoctor(user._id);
    await request(app)
      .post("/api/user/getappointment")
      .set("Authorization", `Bearer ${token}`)
      .field("userInfo",   JSON.stringify(user._id))
      .field("doctorInfo", JSON.stringify(doctor._id))
      .field("date",       "2025-12-25 10:00");
    const appt = await appointmentModel.findOne({ userInfo: user._id });
    expect(appt).not.toBeNull();
    expect(appt.status).toBe("pending");
  });

  test("5.3 sends notification to the doctor's user account", async () => {
    const { user: doctorUser }           = await createUser({ email: "docuser@test.com" });
    const { user: patientUser, token }   = await createUser({ email: "patient@test.com" });
    const doctor = await createApprovedDoctor(doctorUser._id);
    await request(app)
      .post("/api/user/getappointment")
      .set("Authorization", `Bearer ${token}`)
      .field("userInfo",   JSON.stringify(patientUser._id))
      .field("doctorInfo", JSON.stringify(doctor._id))
      .field("date",       "2025-12-26 09:00");
    const updated = await userModel.findById(doctorUser._id);
    expect(updated.notification.length).toBeGreaterThan(0);
    expect(updated.notification[0].type).toBe("new-appointment");
  });

  test("5.4 returns 400 when required fields are missing", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/user/getappointment")
      .set("Authorization", `Bearer ${token}`)
      .field("date", "2025-12-25 10:00");
    expect(res.status).toBe(400);
  });

  test("5.5 returns 404 when doctorId does not exist", async () => {
    const { user, token } = await createUser();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post("/api/user/getappointment")
      .set("Authorization", `Bearer ${token}`)
      .field("userInfo",   JSON.stringify(user._id))
      .field("doctorInfo", JSON.stringify(fakeId))
      .field("date",       "2025-12-25 10:00");
    expect(res.status).toBe(404);
  });

  test("5.6 returns 401 without token", async () => {
    const res = await request(app).post("/api/user/getappointment").send({});
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 6. POST /api/user/getallnotification
// ═════════════════════════════════════════════════════════════════
describe("6. POST /api/user/getallnotification", () => {
  test("6.1 moves notifications to seennotification and clears notification[]", async () => {
    const { user, token } = await createUser();
    await userModel.findByIdAndUpdate(user._id, {
      $push: {
        notification: {
          $each: [
            { type: "t", message: "Msg 1", onClickPath: "/" },
            { type: "t", message: "Msg 2", onClickPath: "/" },
          ],
        },
      },
    });
    const res = await request(app)
      .post("/api/user/getallnotification")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    const updated = await userModel.findById(user._id);
    expect(updated.notification).toHaveLength(0);
    expect(updated.seennotification).toHaveLength(2);
  });

  test("6.2 works when notification[] is already empty", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post("/api/user/getallnotification")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
  });

  test("6.3 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/user/getallnotification")
      .send({});
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 7. POST /api/user/deleteallnotification
// ═════════════════════════════════════════════════════════════════
describe("7. POST /api/user/deleteallnotification", () => {
  test("7.1 clears both notification[] and seennotification[]", async () => {
    const { user, token } = await createUser();
    await userModel.findByIdAndUpdate(user._id, {
      $set: {
        notification:     [{ type: "t", message: "m",  onClickPath: "/" }],
        seennotification: [{ type: "t", message: "m2", onClickPath: "/" }],
      },
    });
    const res = await request(app)
      .post("/api/user/deleteallnotification")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    const updated = await userModel.findById(user._id);
    expect(updated.notification).toHaveLength(0);
    expect(updated.seennotification).toHaveLength(0);
  });

  test("7.2 returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/user/deleteallnotification")
      .send({});
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 8. GET /api/user/getuserappointments
// ═════════════════════════════════════════════════════════════════
describe("8. GET /api/user/getuserappointments", () => {
  test("8.1 returns only the logged-in user's appointments", async () => {
    const { user: u1, token: t1 } = await createUser({ email: "u1@test.com" });
    const { user: u2 }            = await createUser({ email: "u2@test.com" });
    const doctor = await createApprovedDoctor(u1._id);
    await appointmentModel.create({
      userInfo: u1._id, doctorInfo: doctor._id, date: "2025-12-20",
    });
    await appointmentModel.create({
      userInfo: u2._id, doctorInfo: doctor._id, date: "2025-12-21",
    });
    const res = await request(app)
      .get("/api/user/getuserappointments")
      .set("Authorization", `Bearer ${t1}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userInfo.toString()).toBe(u1._id.toString());
  });

  test("8.2 returns empty array when user has no appointments", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/user/getuserappointments")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("8.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/user/getuserappointments");
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════
// 9. GET /api/user/getDocsforuser
// ═════════════════════════════════════════════════════════════════
describe("9. GET /api/user/getDocsforuser", () => {
  test("9.1 returns the user's documents array", async () => {
    const { user, token } = await createUser();
    await userModel.findByIdAndUpdate(user._id, {
      $push: { documents: { name: "blood_test.pdf", path: "/uploads/blood_test.pdf" } },
    });
    const res = await request(app)
      .get("/api/user/getDocsforuser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("blood_test.pdf");
  });

  test("9.2 returns empty array when user has no documents", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/user/getDocsforuser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test("9.3 returns 401 without token", async () => {
    const res = await request(app).get("/api/user/getDocsforuser");
    expect(res.status).toBe(401);
  });
});
