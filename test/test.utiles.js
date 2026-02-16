const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  convertCents,
  isValidMoney,
  saveData,
  getData,
  getDataById,
  updateData,
  deleteData,
  getRemainingBudget,
  getTotalEnvelopesBudget,
  getEnvelopeRemaingBudgetCents,
} = require("../routes/utiles.js");

// --- convertCents ---
describe("convertCents", () => {
  it("should convert dollars to cents", () => {
    assert.equal(convertCents(10), 1000);
  });

  it("should handle decimal values", () => {
    assert.equal(convertCents(19.99), 1999);
  });

  it("should handle small cents like 0.01", () => {
    assert.equal(convertCents(0.01), 1);
  });

  it("should round floating point errors", () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS
    assert.equal(convertCents(0.1 + 0.2), 30);
  });

  it("should convert string numbers", () => {
    assert.equal(convertCents("25.50"), 2550);
  });

  it("should return 0 for 0", () => {
    assert.equal(convertCents(0), 0);
  });
});

// --- isValidMoney ---
describe("isValidMoney", () => {
  it("should return true for a positive integer", () => {
    assert.equal(isValidMoney(10), true);
  });

  it("should return true for a positive decimal with two places", () => {
    assert.equal(isValidMoney(19.99), true);
  });

  it("should return true for a positive decimal with one place", () => {
    assert.equal(isValidMoney(5.5), true);
  });

  it("should return false for 0", () => {
    assert.equal(isValidMoney(0), false);
  });

  it("should return false for negative numbers", () => {
    assert.equal(isValidMoney(-10), false);
  });

  it("should return false for more than two decimal places", () => {
    assert.equal(isValidMoney(10.999), false);
  });

  it("should return false for a string", () => {
    assert.equal(isValidMoney("10"), false);
  });

  it("should return false for NaN", () => {
    assert.equal(isValidMoney(NaN), false);
  });

  it("should return false for Infinity", () => {
    assert.equal(isValidMoney(Infinity), false);
  });

  it("should return false for null", () => {
    assert.equal(isValidMoney(null), false);
  });

  it("should return false for undefined", () => {
    assert.equal(isValidMoney(undefined), false);
  });
});

// --- saveData & getData for budget ---
describe("saveData and getData for budget", () => {
  it("should save and retrieve the budget", () => {
    const result = saveData("budget", 100000);
    assert.equal(result, 100000);
    assert.equal(getData("budget"), 100000);
  });

  it("should overwrite the budget when saved again", () => {
    saveData("budget", 200000);
    assert.equal(getData("budget"), 200000);
  });
});

// --- saveData & getData for envelopes ---
describe("saveData and getData for envelopes", () => {
  it("should save an envelope and return it with an id", () => {
    const envelope = saveData("envelopes", {
      name: "Groceries",
      amountCents: 40000,
    });
    assert.equal(envelope.name, "Groceries");
    assert.equal(envelope.amountCents, 40000);
    assert.equal(typeof envelope.id, "number");
  });

  it("should assign incrementing ids", () => {
    const envelope2 = saveData("envelopes", {
      name: "Rent",
      amountCents: 80000,
    });
    const envelope3 = saveData("envelopes", {
      name: "Transport",
      amountCents: 15000,
    });
    assert.equal(envelope3.id, envelope2.id + 1);
  });

  it("should return all envelopes with getData", () => {
    const envelopes = getData("envelopes");
    assert.equal(envelopes.length, 3);
    assert.equal(envelopes[0].name, "Groceries");
  });
});

// --- getDataById for envelopes ---
describe("getDataById", () => {
  it("should find an envelope by id", () => {
    const envelopes = getData("envelopes");
    const id = envelopes[0].id;
    const found = getDataById("envelopes", id);
    assert.equal(found.name, "Groceries");
  });

  it("should find an envelope by string id", () => {
    const envelopes = getData("envelopes");
    const id = String(envelopes[0].id);
    const found = getDataById("envelopes", id);
    assert.equal(found.name, "Groceries");
  });

  it("should return undefined for a non-existent id", () => {
    const found = getDataById("envelopes", 9999);
    assert.equal(found, undefined);
  });

  it("should return undefined when id is not provided", () => {
    const found = getDataById("envelopes");
    assert.equal(found, undefined);
  });
});

// --- updateData for envelopes ---
describe("updateData", () => {
  it("should update an envelope and return the updated object", () => {
    const envelopes = getData("envelopes");
    const target = envelopes[0];
    const updated = updateData("envelopes", target.id, {
      id: target.id,
      name: "Food",
      amountCents: 45000,
    });
    assert.equal(updated.name, "Food");
    assert.equal(updated.amountCents, 45000);
    assert.equal(updated.id, target.id);
  });

  it("should persist the update in getData", () => {
    const envelopes = getData("envelopes");
    assert.equal(envelopes[0].name, "Food");
  });
});

// --- getTotalEnvelopesBudget ---
describe("getTotalEnvelopesBudget", () => {
  it("should return the sum of all envelope amounts", () => {
    // Food: 45000, Rent: 80000, Transport: 15000
    const total = getTotalEnvelopesBudget();
    assert.equal(total, 45000 + 80000 + 15000);
  });
});

// --- getRemainingBudget ---
describe("getRemainingBudget", () => {
  it("should return budget minus all envelope amounts", () => {
    // budget: 200000, envelopes total: 140000
    const remaining = getRemainingBudget();
    assert.equal(remaining, 200000 - (45000 + 80000 + 15000));
  });
});

// --- saveData & getData for spendings ---
describe("saveData and getData for spendings", () => {
  it("should save a spending and return it with an id", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[0].id;
    const spending = saveData("spendings", {
      name: "Walmart",
      amountCents: 5000,
      envelopeId: envelopeId,
    });
    assert.equal(spending.name, "Walmart");
    assert.equal(spending.amountCents, 5000);
    assert.equal(spending.envelopeId, envelopeId);
    assert.equal(typeof spending.id, "number");
  });

  it("should save another spending to a different envelope", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[1].id;
    saveData("spendings", {
      name: "Rent payment",
      amountCents: 80000,
      envelopeId: envelopeId,
    });
    const allSpendings = getData("spendings");
    assert.equal(allSpendings.length, 2);
  });

  it("should return all spendings with getData", () => {
    const spendings = getData("spendings");
    assert.equal(spendings.length, 2);
  });

  it("should filter spendings by envelope id", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[0].id;
    const filtered = getData("spendings", envelopeId);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].name, "Walmart");
  });

  it("should return empty array when filtering by envelope with no spendings", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[2].id; // Transport has no spendings
    const filtered = getData("spendings", envelopeId);
    assert.equal(filtered.length, 0);
  });
});

// --- getDataById for spendings ---
describe("getDataById for spendings", () => {
  it("should find a spending by id", () => {
    const spendings = getData("spendings");
    const id = spendings[0].id;
    const found = getDataById("spendings", id);
    assert.equal(found.name, "Walmart");
  });

  it("should return undefined for a non-existent spending id", () => {
    const found = getDataById("spendings", 9999);
    assert.equal(found, undefined);
  });
});

// --- getEnvelopeRemaingBudgetCents ---
describe("getEnvelopeRemaingBudgetCents", () => {
  it("should return envelope amount minus its spendings", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[0].id; // Food: 45000, spent: 5000
    const remaining = getEnvelopeRemaingBudgetCents(envelopeId);
    assert.equal(remaining, 45000 - 5000);
  });

  it("should return full amount for envelope with no spendings", () => {
    const envelopes = getData("envelopes");
    const envelopeId = envelopes[2].id; // Transport: 15000, no spendings
    const remaining = getEnvelopeRemaingBudgetCents(envelopeId);
    assert.equal(remaining, 15000);
  });

  it("should accept string id", () => {
    const envelopes = getData("envelopes");
    const envelopeId = String(envelopes[0].id);
    const remaining = getEnvelopeRemaingBudgetCents(envelopeId);
    assert.equal(remaining, 40000);
  });
});

// --- deleteData ---
describe("deleteData for a specific spending", () => {
  it("should delete a specific spending by id", () => {
    const spendings = getData("spendings");
    const spendingId = spendings[0].id; // Walmart
    deleteData("spendings", spendingId, true);
    const after = getData("spendings");
    assert.equal(after.length, 1);
    const deleted = getDataById("spendings", spendingId);
    assert.equal(deleted, undefined);
  });
});

describe("deleteData for all spendings of an envelope", () => {
  it("should delete all spendings for a specific envelope", () => {
    // Add a spending back to envelope[1] so we have something to delete
    const envelopes = getData("envelopes");
    saveData("spendings", {
      name: "Extra rent",
      amountCents: 1000,
      envelopeId: envelopes[1].id,
    });
    const before = getData("spendings", envelopes[1].id);
    assert.ok(before.length > 0);

    deleteData("Allspendings", envelopes[1].id);
    const after = getData("spendings", envelopes[1].id);
    assert.equal(after.length, 0);
  });
});

describe("deleteData for all spendings", () => {
  it("should delete all spendings across all envelopes", () => {
    // Add some spendings first
    const envelopes = getData("envelopes");
    saveData("spendings", {
      name: "Test1",
      amountCents: 100,
      envelopeId: envelopes[0].id,
    });
    saveData("spendings", {
      name: "Test2",
      amountCents: 200,
      envelopeId: envelopes[1].id,
    });
    assert.ok(getData("spendings").length > 0);

    deleteData("spendings");
    assert.equal(getData("spendings").length, 0);
  });
});

describe("deleteData for envelopes", () => {
  it("should delete an envelope by id", () => {
    const envelopes = getData("envelopes");
    const countBefore = envelopes.length;
    const target = envelopes[0];
    deleteData("envelopes", target.id);
    const after = getData("envelopes");
    assert.equal(after.length, countBefore - 1);
    const deleted = getDataById("envelopes", target.id);
    assert.equal(deleted, undefined);
  });
});
