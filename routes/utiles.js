let data = {
  budgetCents: 0,
  envelopes: [],
  spendings: [],
};

let nextEnvelopeId = data.envelopes.length + 1;
let nextSpendingId = data.spendings.length + 1;

function convertCents(price) {
  return Math.round(Number(price) * 100);
}

function getRemainingBudget() {
  let totalEnvelopesBudgetCents = 0;

  data.envelopes.forEach((e) => {
    totalEnvelopesBudgetCents += e.amountCents;
  });

  const RemainingBudgetCents = data.budgetCents - totalEnvelopesBudgetCents;
  return RemainingBudgetCents;
}

function getEnvelopeRemaingBudgetCents(envelopeId) {
  let totalSpendingsCents = 0;

  const envelope = data.envelopes.find((e) => {
    return e.id === Number(envelopeId);
  });

  const spendingsForEnvelope = data.spendings.filter((e) => {
    return e.envelopeId === Number(envelopeId);
  });

  spendingsForEnvelope.forEach((s) => {
    totalSpendingsCents += s.amountCents;
  });

  const reamingEnvelopeAmountCents = envelope.amountCents - totalSpendingsCents;
  return reamingEnvelopeAmountCents;
}

function saveData(instence, dataToSave) {
  if (instence === "budget") {
    data.budgetCents = dataToSave;
    return data;
  }

  if (instence === "envelopes") {
    const newEnvelope = {
      id: nextEnvelopeId,
      name: dataToSave.name,
      amountCents: dataToSave.amountCents,
    };
    nextEnvelopeId += 1;

    data.envelopes.push(newEnvelope);
    return newEnvelope;
  }

  if (instence === "spendings") {
    // dataToSave {name:, amountCents:, envelopeId:}
    const newSpending = {
      id: nextSpendingId,
      envelopeId: dataToSave.envelopeId,
      name: dataToSave.name,
      amountCents: dataToSave.amountCents,
    };
    nextSpendingId += 1;
    data.spendings.push(newSpending);
    return data.spendings;
  }
}
// { name:, amont:}

function getData(instence, id) {
  if (instence === "budget") {
    return data.budgetCents;
  }
  if (instence === "envelopes") {
    return data.envelopes;
  }
  if (instence === "spendings" && id) {
    return data.spendings.filter((s) => {
      return s.envelopeId === Number(id);
    });
  }
  if (instence === "spendings") {
    return data.spendings;
  }
}

function updateData(instence, id, newObject) {
  if (instence === "envelopes") {
    const index = data.envelopes.findIndex((e) => {
      return e.id === id;
    });
    data.envelopes[index] = newObject;
    // returning the whole envelopes array temporary
    return data.envelopes;
  }
}

function deleteData(instence, id, isSpecificSp) {
  if (instence === "envelopes" && id) {
    const index = data.envelopes.findIndex((e) => {
      return e.id === id;
    });
    data.envelopes.splice(index, 1);
    // returning the whole envelopes array temporary
    return data.envelopes;
  }
  // only deletes spendings for a specific envelope
  if (instence === "Allspendings" && id && !isSpecificSp) {
    // the id is the envelopes'id
    const removeSpendingsForEnvelopeId = data.spendings.filter((s) => {
      return s.envelopeId !== Number(id);
    });
    data.spendings = removeSpendingsForEnvelopeId;
    return data.spendings;
  }
  // delete all spendings for all envelopes
  if (instence === "spendings" && !isSpecificSp) {
    data.spendings = [];
    return data.spendings;
  }
  if (instence === "spendings" && id && isSpecificSp) {
    const spendingIndex = data.spendings.findIndex((s) => {
      return s.id === Number(id);
    });
    data.spendings.splice(spendingIndex, 1);
    return data.spendings;
  }
}

function getDataById(instence, id) {
  if (instence === "envelopes" && id) {
    return data.envelopes.find((e) => {
      return e.id === Number(id);
    });
  }
}

function isValidMoney(value) {
  const num = Number(value);
  return (
    Number.isFinite(value) && num > 0 && Math.round(num * 100) / 100 === num
  );
}

module.exports = {
  convertCents,
  saveData,
  isValidMoney,
  getData,
  getRemainingBudget,
  getDataById,
  updateData,
  deleteData,
  getEnvelopeRemaingBudgetCents,
};
