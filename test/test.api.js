const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const app = require("../routes/api.js");

let server;
let BASE;

before(async () => {
  await new Promise((resolve) => {
    // Use port 0 to let the OS pick a free port
    server = app.listen(0, () => {
      const port = server.address().port;
      BASE = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Helper for requests
function post(path, body) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function put(path, body) {
  return fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function get(path) {
  return fetch(`${BASE}${path}`);
}

function del(path) {
  return fetch(`${BASE}${path}`, { method: "DELETE" });
}

// ==================== BUDGET ====================
describe("Budget API", () => {
  it("GET /budget should return 0 initially", async () => {
    const res = await get("/budget");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.budgetCents, 0);
  });

  it("POST /budget should reject empty body", async () => {
    const res = await post("/budget", {});
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("POST /budget should reject invalid budget", async () => {
    const res = await post("/budget", { budget: "abc" });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("POST /budget should reject budget of 0", async () => {
    const res = await post("/budget", { budget: 0 });
    assert.equal(res.status, 400);
  });

  it("POST /budget should reject negative budget", async () => {
    const res = await post("/budget", { budget: -100 });
    assert.equal(res.status, 400);
  });

  it("POST /budget should create a budget", async () => {
    const res = await post("/budget", { budget: 2000 });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.budgetCents, 200000);
  });

  it("GET /budget should return the saved budget", async () => {
    const res = await get("/budget");
    const data = await res.json();
    assert.equal(data.budgetCents, 200000);
  });

  it("POST /budget should update the budget", async () => {
    const res = await post("/budget", { budget: 3000 });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.budgetCents, 300000);
  });
});

// ==================== ENVELOPES ====================
describe("Envelopes API", () => {
  it("GET /envelopes should return empty array initially", async () => {
    const res = await get("/envelopes");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.envelopes));
  });

  it("POST /envelopes should reject empty body", async () => {
    const res = await post("/envelopes", {});
    assert.equal(res.status, 400);
  });

  it("POST /envelopes should reject missing name", async () => {
    const res = await post("/envelopes", { amount: 100 });
    assert.equal(res.status, 400);
  });

  it("POST /envelopes should reject missing amount", async () => {
    const res = await post("/envelopes", { name: "Food" });
    assert.equal(res.status, 400);
  });

  it("POST /envelopes should reject invalid amount", async () => {
    const res = await post("/envelopes", { name: "Food", amount: "abc" });
    assert.equal(res.status, 400);
  });

  it("POST /envelopes should create an envelope", async () => {
    const res = await post("/envelopes", { name: "Groceries", amount: 400 });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.data.name, "Groceries");
    assert.equal(data.data.amountCents, 40000);
    assert.ok(data.data.id);
  });

  it("POST /envelopes should reject duplicate name", async () => {
    const res = await post("/envelopes", { name: "Groceries", amount: 100 });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes("already exist"));
  });

  it("POST /envelopes should reject duplicate name case-insensitive", async () => {
    const res = await post("/envelopes", { name: "groceries", amount: 100 });
    assert.equal(res.status, 400);
  });

  it("POST /envelopes should create a second envelope", async () => {
    const res = await post("/envelopes", { name: "Rent", amount: 800 });
    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.data.name, "Rent");
  });

  it("POST /envelopes should reject amount exceeding remaining budget", async () => {
    const res = await post("/envelopes", { name: "TooBig", amount: 999999 });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes("greater than"));
  });

  it("GET /envelopes should return all envelopes", async () => {
    const res = await get("/envelopes");
    const data = await res.json();
    assert.equal(data.envelopes.length, 2);
  });

  it("GET /envelopes/:id should return a specific envelope", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const id = list.envelopes[0].id;

    const res = await get(`/envelopes/${id}`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.envelope.id, id);
  });

  it("GET /envelopes/:id should return 404 for non-existent id", async () => {
    const res = await get("/envelopes/9999");
    assert.equal(res.status, 404);
  });

  it("PUT /envelopes/:id should update an envelope", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const id = list.envelopes[0].id;

    const res = await put(`/envelopes/${id}`, { name: "Food", amount: 450 });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.updatedEnvelope.name, "Food");
    assert.equal(data.updatedEnvelope.amountCents, 45000);
  });

  it("PUT /envelopes/:id should reject empty body", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const id = list.envelopes[0].id;

    const res = await put(`/envelopes/${id}`, {});
    assert.equal(res.status, 400);
  });

  it("PUT /envelopes/:id should allow keeping the same name", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const envelope = list.envelopes[0];

    const res = await put(`/envelopes/${envelope.id}`, {
      name: envelope.name,
      amount: 500,
    });
    assert.equal(res.status, 200);
  });

  it("PUT /envelopes/:id should reject name that conflicts with another envelope", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const id = list.envelopes[0].id;

    const res = await put(`/envelopes/${id}`, { name: "Rent", amount: 100 });
    assert.equal(res.status, 400);
  });

  it("PUT /envelopes/:id should return 404 for non-existent id", async () => {
    const res = await put("/envelopes/9999", { name: "X", amount: 10 });
    assert.equal(res.status, 404);
  });

  it("DELETE /envelopes/:id should delete an envelope", async () => {
    const listRes = await get("/envelopes");
    const list = await listRes.json();
    const countBefore = list.envelopes.length;
    const id = list.envelopes[0].id;

    const res = await del(`/envelopes/${id}`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);

    const afterRes = await get("/envelopes");
    const afterData = await afterRes.json();
    assert.equal(afterData.envelopes.length, countBefore - 1);
  });

  it("DELETE /envelopes/:id should return 404 for non-existent id", async () => {
    const res = await del("/envelopes/9999");
    assert.equal(res.status, 404);
  });
});

// ==================== SPENDINGS ====================
describe("Spendings API", () => {
  let envelopeId;

  // Create an envelope to use for spendings
  before(async () => {
    const res = await post("/envelopes", { name: "SpendTest", amount: 500 });
    const data = await res.json();
    envelopeId = data.data.id;
  });

  it("GET /spendings should return empty array initially", async () => {
    const res = await get("/spendings");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.spendings));
  });

  it("POST /spendings/:envelopeId should reject empty body", async () => {
    const res = await post(`/spendings/${envelopeId}`, {});
    assert.equal(res.status, 400);
  });

  it("POST /spendings/:envelopeId should reject missing name", async () => {
    const res = await post(`/spendings/${envelopeId}`, { amount: 10 });
    const text = await res.text();
    assert.ok(text.includes("missing"));
  });

  it("POST /spendings/:envelopeId should reject missing amount", async () => {
    const res = await post(`/spendings/${envelopeId}`, { name: "Test" });
    const text = await res.text();
    assert.ok(text.includes("missing"));
  });

  it("POST /spendings/:envelopeId should create a spending", async () => {
    const res = await post(`/spendings/${envelopeId}`, {
      name: "Coffee",
      amount: 5,
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.spending.name, "Coffee");
    assert.equal(data.spending.amountCents, 500);
    assert.equal(data.spending.envelopeId, envelopeId);
  });

  it("POST /spendings/:envelopeId should reject spending exceeding envelope budget", async () => {
    const res = await post(`/spendings/${envelopeId}`, {
      name: "TooBig",
      amount: 999999,
    });
    const text = await res.text();
    assert.ok(text.includes("remaing budget"));
  });

  it("POST /spendings/:envelopeId should return 404 for non-existent envelope", async () => {
    const res = await post("/spendings/9999", { name: "Test", amount: 5 });
    assert.equal(res.status, 404);
  });

  it("POST /spendings/:envelopeId should create a second spending", async () => {
    const res = await post(`/spendings/${envelopeId}`, {
      name: "Lunch",
      amount: 12,
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.spending.name, "Lunch");
  });

  it("GET /spendings should return all spendings", async () => {
    const res = await get("/spendings");
    const data = await res.json();
    assert.ok(data.spendings.length >= 2);
  });

  it("GET /spendings/:envelopeId should return spendings for an envelope", async () => {
    const res = await get(`/spendings/${envelopeId}`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.envelope.id, envelopeId);
    assert.ok(data.spendings.length >= 2);
  });

  it("GET /spendings/:envelopeId should return 404 for non-existent envelope", async () => {
    const res = await get("/spendings/9999");
    assert.equal(res.status, 404);
  });

  it("DELETE /spendings/All/:envelopeId should delete all spendings for an envelope", async () => {
    const res = await del(`/spendings/All/${envelopeId}`);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.message.includes("successfully deleted"));

    // Verify they're gone
    const checkRes = await get(`/spendings/${envelopeId}`);
    const checkData = await checkRes.json();
    assert.equal(checkData.spendings.length, 0);
  });

  it("DELETE /spendings should delete all spendings", async () => {
    // Add some spendings first
    await post(`/spendings/${envelopeId}`, { name: "Temp1", amount: 1 });
    await post(`/spendings/${envelopeId}`, { name: "Temp2", amount: 2 });

    const res = await del("/spendings");
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.message.includes("reset"));

    const checkRes = await get("/spendings");
    const checkData = await checkRes.json();
    assert.equal(checkData.spendings.length, 0);
  });
});

// ==================== Budget update constraint ====================
describe("Budget update constraint", () => {
  it("POST /budget should reject lowering budget below total envelope amounts", async () => {
    // Current budget is 300000 (3000), envelopes exist with allocated amounts
    // Try to set budget to 1 cent which is below total envelope amounts
    const res = await post("/budget", { budget: 0.01 });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes("greater than"));
  });
});

// ==================== Error handling ====================
describe("Error handling", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await get("/unknown");
    assert.equal(res.status, 404);
  });
});
