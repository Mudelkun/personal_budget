const express = require("express");
const app = express();

module.exports = app;

app.use(express.json());

const {
  convertCents,
  saveData,
  isValidMoney,
  getData,
  getRemainingBudget,
  getDataById,
  updateData,
  deleteData,
  getEnvelopeRemaingBudgetCents,
} = require("./utiles.js");

const budget = "budget";
const envelopes = "envelopes";

function validateBudget(req, res, next) {
  const { budget } = req.body;
  if (isValidMoney(budget)) {
    req.budget = budget;
    next();
    return;
  }
  res.status(400).json({
    success: false,
    message: "Budget could not be validate",
  });
}

function validateEnvlope(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body cannot be empty.",
    });
  }

  const { name, amount } = req.body;
  const amountCents = isValidMoney(amount) ? convertCents(amount) : false;
  const budgetCents = getData("budget");
  const RemainingBudgetCents = getRemainingBudget();
  const envelopes = getData("envelopes");

  if (budgetCents === 0) {
    res.status(400).json("A budget must be set to create an envelope");
    return;
  }
  if (!amountCents) {
    res.send("The envelope's budget amount is Invalid");
    return;
  }
  if (!name) {
    res.send("The envlope's name was not set");
    return;
  }

  const sameName = envelopes.find((e) => {
    return e.name.toLowerCase() === name.toLowerCase();
  });

  if (sameName) {
    res.send(`An envelope with that name already exist: ${name}`);
    return;
  }

  if (amountCents > RemainingBudgetCents) {
    // send budget for frontend to use
    res.send({
      RemainingBudget: RemainingBudgetCents,
    });
    return;
  }

  req.amountCents = amountCents;
  req.name = name;
  next();
}

function validateSpending(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body cannot be empty.",
    });
  }

  const { name, amount } = req.body;
  if (!name || !amount) {
    res.send("Some properties are missing");
    return;
  }
  const spendingAmountCents = convertCents(amount);
  const reamingEnvelopeAmountCents = getEnvelopeRemaingBudgetCents(
    req.envelope.id,
  );

  if (spendingAmountCents > reamingEnvelopeAmountCents) {
    res.send(
      `remaing budget for this envelope(${req.envelope.name}) is ${reamingEnvelopeAmountCents} cents`,
    );
    return;
  }
  req.spendingName = name;
  req.spendingAmountCents = spendingAmountCents;
  next();
}

app.param("envelopeId", (req, res, next, envelopeId) => {
  if (!envelopeId) {
    res.status(400).send("Id is missing");
    return;
  }
  const envelope = getDataById(envelopes, envelopeId);
  if (!envelope) {
    res.status(404).send("Envelope does not existe");
    return;
  }
  req.envelope = envelope;
  next();
});

app.post("/budget", validateBudget, (req, res) => {
  const budgetCents = convertCents(req.budget);
  const save = saveData("budget", budgetCents);
  res.send(`Data was saved succesfully: ${save.budgetCents}`);
});

app.get("/budget", (req, res) => {
  const budgetCents = getData("budget");
  res.send({
    budgetCents: budgetCents,
  });
});

app.post("/envelopes", validateEnvlope, (req, res) => {
  res.send(
    saveData("envelopes", { name: req.name, amountCents: req.amountCents }),
  );
});

app.get("/envelopes", (req, res) => {
  res.send(getData(envelopes));
});

app.get("/envelopes/:envelopeId", (req, res) => {
  res.send(req.envelope);
});

// We recive an new object with all new properties
// we need to validate the object first
// then update
app.put("/envelopes/:envelopeId", validateEnvlope, (req, res) => {
  req.envelope = {
    id: req.envelope.id,
    name: req.name,
    amountCents: req.amountCents,
  };
  res.send(updateData(envelopes, req.envelope.id, req.envelope));
});

app.delete("/envelopes/:envelopeId", (req, res) => {
  res.send(deleteData(envelopes, req.envelope.id));
});

app.get("/spendings", (req, res) => {
  res.send(getData("spendings"));
});

app.get("/spendings/:envelopeId", (req, res) => {
  res.send(getData("spendings", req.envelope.id));
});

// get for wich envelope spending is for
// validate spending by checking if the spending amount is less then reamingEnvelopeAmountCents
// push the spending
app.post("/spendings/:envelopeId", validateSpending, (req, res) => {
  // dataToSave {name:, amountCents:, envelopeId:}
  res.send(
    saveData("spendings", {
      name: req.spendingName,
      amountCents: req.spendingAmountCents,
      envelopeId: req.envelope.id,
    }),
  );
});

// Delete all spendings for a specific envelope
app.delete("/Allspendings/:envelopeId", (req, res) => {
  res.send(deleteData("Allspendings", req.envelope.id));
});

// Delete all spendings for all envelopes
app.delete("/spendings", (req, res) => {
  res.send(deleteData("spendings"));
});

app.delete("/spendings/:spendingId", (req, res) => {
  res.send(deleteData("spendings", req.params.spendingId, true));
});
