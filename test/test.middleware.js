const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  requireBody,
  validateBudget,
  validateEnvlope,
  validateSpending,
  findEnvelope,
} = require("../routes/middleware.js");

const { saveData, getData } = require("../routes/utiles.js");

// Helper to create a mock res object that captures status/json/send calls
function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
    },
    send(data) {
      res.body = data;
    },
  };
  return res;
}

// --- requireBody ---
describe("requireBody", () => {
  it("should call next when body has properties", () => {
    const req = { body: { budget: 100 } };
    const res = mockRes();
    let called = false;
    requireBody(req, res, () => { called = true; });
    assert.equal(called, true);
  });

  it("should return 400 when body is empty object", () => {
    const req = { body: {} };
    const res = mockRes();
    let called = false;
    requireBody(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  it("should return 400 when body is null", () => {
    const req = { body: null };
    const res = mockRes();
    let called = false;
    requireBody(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 when body is undefined", () => {
    const req = {};
    const res = mockRes();
    let called = false;
    requireBody(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });
});

// --- validateBudget ---
describe("validateBudget", () => {
  it("should call next and set req.budget for valid budget", () => {
    const req = { body: { budget: 100 } };
    const res = mockRes();
    let called = false;
    validateBudget(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.budget, 100);
  });

  it("should set req.totalEnvelopesBudgetCents", () => {
    const req = { body: { budget: 500 } };
    const res = mockRes();
    validateBudget(req, res, () => {});
    assert.equal(typeof req.totalEnvelopesBudgetCents, "number");
  });

  it("should return 400 for invalid budget (string)", () => {
    const req = { body: { budget: "abc" } };
    const res = mockRes();
    let called = false;
    validateBudget(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  });

  it("should return 400 for budget of 0", () => {
    const req = { body: { budget: 0 } };
    const res = mockRes();
    let called = false;
    validateBudget(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 for negative budget", () => {
    const req = { body: { budget: -50 } };
    const res = mockRes();
    let called = false;
    validateBudget(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 when budget property is missing", () => {
    const req = { body: { amount: 100 } };
    const res = mockRes();
    let called = false;
    validateBudget(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });
});

// --- validateEnvlope ---
describe("validateEnvlope", () => {
  beforeEach(() => {
    saveData("budget", 500000);
  });

  it("should call next and set req.name and req.amountCents for valid input", () => {
    const req = { body: { name: "TestEnv", amount: 100 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.name, "TestEnv");
    assert.equal(req.amountCents, 10000);
  });

  it("should return 400 when budget is 0", () => {
    saveData("budget", 0);
    const req = { body: { name: "Test", amount: 100 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes("budget must be set"));
  });

  it("should return 400 when amount is invalid", () => {
    const req = { body: { name: "Test", amount: "abc" } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes("Invalid"));
  });

  it("should return 400 when amount is negative", () => {
    const req = { body: { name: "Test", amount: -50 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 when name is missing", () => {
    const req = { body: { amount: 100 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes("name"));
  });

  it("should return 400 when name is empty string", () => {
    const req = { body: { name: "", amount: 100 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 for duplicate envelope name", () => {
    saveData("envelopes", { name: "MWDuplicate", amountCents: 1000 });
    const req = { body: { name: "MWDuplicate", amount: 50 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes("already exist"));
  });

  it("should return 400 for duplicate name case-insensitive", () => {
    const req = { body: { name: "mwduplicate", amount: 50 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should allow same name when updating the same envelope", () => {
    const envelopes = getData("envelopes");
    const existing = envelopes.find((e) => e.name === "MWDuplicate");
    const req = {
      body: { name: "MWDuplicate", amount: 60 },
      envelope: existing,
    };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, true);
  });

  it("should return 400 when amount exceeds remaining budget", () => {
    const req = { body: { name: "TooBig", amount: 99999 } };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.message.includes("greater than"));
  });

  it("should free up old amount when updating an envelope", () => {
    const bigEnvelope = saveData("envelopes", { name: "MWBig", amountCents: 490000 });
    const req = {
      body: { name: "MWBig", amount: 4950 },
      envelope: bigEnvelope,
    };
    const res = mockRes();
    let called = false;
    validateEnvlope(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.amountCents, 495000);
  });
});

// --- validateSpending ---
describe("validateSpending", () => {
  beforeEach(() => {
    saveData("budget", 500000);
  });

  it("should return 400 when body is empty", () => {
    const req = { body: {}, envelope: { id: 1, name: "Test", amountCents: 10000 } };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should return 400 when body is null", () => {
    const req = { body: null, envelope: { id: 1 } };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });

  it("should reject when name is missing", () => {
    const envelopes = getData("envelopes");
    const envelope = envelopes[0];
    const req = { body: { amount: 10 }, envelope };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, false);
  });

  it("should reject when amount is missing", () => {
    const envelopes = getData("envelopes");
    const envelope = envelopes[0];
    const req = { body: { name: "Test" }, envelope };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, false);
  });

  it("should call next for valid spending within budget", () => {
    const envelopes = getData("envelopes");
    const envelope = envelopes[0];
    const req = { body: { name: "Groceries", amount: 5 }, envelope };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.spendingName, "Groceries");
    assert.equal(req.spendingAmountCents, 500);
  });

  it("should reject spending that exceeds envelope remaining budget", () => {
    const envelopes = getData("envelopes");
    const envelope = envelopes[0];
    const req = { body: { name: "TooBig", amount: 999999 }, envelope };
    const res = mockRes();
    let called = false;
    validateSpending(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.ok(String(res.body).includes("remaing budget"));
  });
});

// --- findEnvelope ---
describe("findEnvelope", () => {
  it("should set req.envelope and call next for valid id", () => {
    const envelopes = getData("envelopes");
    const envelope = envelopes[0];
    const req = {};
    const res = mockRes();
    let called = false;
    findEnvelope(req, res, () => { called = true; }, String(envelope.id));
    assert.equal(called, true);
    assert.equal(req.envelope.id, envelope.id);
  });

  it("should return 404 for non-existent envelope id", () => {
    const req = {};
    const res = mockRes();
    let called = false;
    findEnvelope(req, res, () => { called = true; }, "9999");
    assert.equal(called, false);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
  });

  it("should return 400 when envelopeId is falsy", () => {
    const req = {};
    const res = mockRes();
    let called = false;
    findEnvelope(req, res, () => { called = true; }, undefined);
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  });
});
