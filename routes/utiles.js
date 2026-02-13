let data = {
  budgetCents: 0,
  envelopes: [],
};

function convertCents(price) {
  return Math.round(price * 100);
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

function getData(dataType) {
  if (dataType === "budget") {
    return data.budgetCents;
  }
  if (dataType === "envelopes") {
    return data.envelopes;
  }
}

function isValideMoney(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) / 100 === num;
}

module.exports = {
  convertCents,
  saveData,
  isValideMoney,
  getData,
  getRemainingBudget,
};
