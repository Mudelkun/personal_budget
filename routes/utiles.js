let data = {
  budgetCents: 10000,
  envelopes: [
    {
      id: 1,
      name: "food",
      amountCents: 1000,
    },
    {
      id: 2,
      name: "Groceries",
      amountCents: 1000,
    },
    {
      id: 3,
      name: "Sports",
      amountCents: 1000,
    },
  ],
};

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

function saveData(instence, dataToSave) {
  if (instence === "budget") {
    data.budgetCents = dataToSave;
    return data;
  }

  if (instence === "envelopes") {
    const newEnvelope = {
      id: data.envelopes.length + 1,
      name: dataToSave.name,
      amountCents: dataToSave.amountCents,
    };

    data.envelopes.push(newEnvelope);
    return newEnvelope;
  }
}
// { name:, amont:}

function getData(instence) {
  if (instence === "budget") {
    return data.budgetCents;
  }
  if (instence === "envelopes") {
    return data.envelopes;
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

function deleteData(instence, id) {
  if (instence === "envelopes") {
    const index = data.envelopes.findIndex((e) => {
      return e.id === id;
    });
    data.envelopes.splice(index, 1);
    // returning the whole envelopes array temporary
    return data.envelopes;
  }
}

function getDataById(instence, id) {
  if (instence === "envelopes") {
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
};
