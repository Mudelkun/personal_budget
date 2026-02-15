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

app.param("envelopeId", (req, res, next, envelopeId) => {
  if (req.method === "DELETE") {
    next();
    return;
  }
  if (!envelopeId) res.status(400).send("Id is missing");
  const envelope = getDataById(envelopes, envelopeId);
  if (!envelope) res.status(404).send("Envelope does not existe");
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
  const envelope = getDataById(envelopes, req.params.envelopeId);
  if (!envelope) {
    res.send("Envelope does not exist");
    return;
  }
  res.send(deleteData(envelopes, envelope.id));
});
