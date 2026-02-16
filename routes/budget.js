const express = require("express");
const budgetRoute = express.Router();
module.exports = { budgetRoute };

const { validateBudget, requireBody } = require("./middleware.js");
const { getData, saveData, convertCents } = require("./utiles.js");

// since the budget is single property we use post methode for both creating and updating
budgetRoute.post("/", requireBody, validateBudget, (req, res, next) => {
  try {
    const budgetCents = convertCents(req.budget);
    if (budgetCents < req.totalEnvelopesBudgetCents) {
      res.status(400).json({
        success: false,
        message: `the new budget must be greater than current envelope total budget: ${req.totalEnvelopesBudgetCents}`,
      });
      return;
    }
    saveData("budget", budgetCents);
    res.status(201).json({
      success: true,
      budgetCents: budgetCents,
    });
  } catch (err) {
    next(err);
  }
});

budgetRoute.get("/", (req, res, next) => {
  try {
    const budgetCents = getData("budget");
    res.status(200).json({
      success: true,
      budgetCents: budgetCents,
    });
  } catch (err) {
    next(err);
  }
});
