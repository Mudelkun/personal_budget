const express = require("express");
const app = express();

module.exports = app;

app.use(express.json());

const {
  convertCents,
  saveData,
  isValideMoney,
  getData,
  getRemainingBudget,
} = require("./utiles.js");

function validateBudget(req, res, next) {
  const budget = req.body.budget;
  if (isValideMoney(budget)) {
    req.budget = budget;
    next();
    return;
  } else {
    res.send("Budget is invalid");
  }
}

function validateEnvlope(req, res, next) {
  const { name, amount } = req.body;
  const amountCents = isValideMoney(amount) ? convertCents(amount) : false;
  const budgetCents = getData("budget");
  const RemainingBudgetCents = getRemainingBudget();

  if (budgetCents === 0) {
    res.send("A budget must be set to create an envelope");
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
  res.send(getData("envelopes"));
});
