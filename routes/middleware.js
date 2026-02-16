const {
  convertCents,
  isValidMoney,
  getData,
  getRemainingBudget,
  getEnvelopeRemaingBudgetCents,
  getDataById,
  getTotalEnvelopesBudget,
} = require("./utiles.js");

function requireBody(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// we should loop throug the envelopes and check if the NewBudgetCents is greater than all envelope amountCents combine
function validateBudget(req, res, next) {
  try {
    const { budget } = req.body;
    if (isValidMoney(budget)) {
      req.totalEnvelopesBudgetCents = getTotalEnvelopesBudget();
      req.budget = budget;
      next();
      return;
    }
    res.status(400).json({
      success: false,
      message:
        "Budget could not be validate! Consider using this format for the body: { budget: Number }",
    });
  } catch (err) {
    next(err);
  }
}

function validateEnvlope(req, res, next) {
  try {
    const { name, amount } = req.body;
    const amountCents = isValidMoney(amount) ? convertCents(amount) : false;
    const budgetCents = getData("budget");
    const RemainingBudgetCents = getRemainingBudget();
    const envelopes = getData("envelopes");

    // updated — on update, the old amount is freed up
    const availableBudgetCents = req.envelope
      ? RemainingBudgetCents + req.envelope.amountCents
      : RemainingBudgetCents;

    if (budgetCents === 0) {
      res.status(400).json({
        success: false,
        message: "A budget must be set to create an envelope",
      });
      return;
    }
    if (!amountCents) {
      res.status(400).json({
        success: false,
        message: "The envelope's budget amount is Invalid",
      });
      return;
    }
    if (!name) {
      res.status(400).json({
        success: false,
        message: "The envlope's name was not set",
      });
      return;
    }

    // updated — exclude the envelope being updated
    const sameName = envelopes.find((e) => {
      return (
        e.name.toLowerCase() === name.toLowerCase() &&
        (!req.envelope || e.id !== req.envelope.id)
      );
    });

    if (sameName) {
      res.status(400).json({
        success: false,
        message: `An envelope with that name already exist: ${name}`,
      });
      return;
    }

    if (amountCents > availableBudgetCents) {
      // send budget for frontend to use
      res.status(400).json({
        success: false,
        message: `Amount is greater than the remaing budget`,
        RemainingBudgetCents: RemainingBudgetCents,
      });
      return;
    }

    req.amountCents = amountCents;
    req.name = name;
    next();
  } catch (err) {
    next(err);
  }
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

function findEnvelope(req, res, next, envelopeId) {
  try {
    if (!envelopeId) {
      res.status(400).json({
        success: false,
        message: "The envelope's id is missing",
      });
      return;
    }
    const envelope = getDataById("envelopes", envelopeId);
    if (!envelope) {
      res.status(404).json({
        success: false,
        message: "Envelope does not existe",
      });
      return;
    }
    req.envelope = envelope;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  validateBudget,
  validateEnvlope,
  validateSpending,
  findEnvelope,
  requireBody,
};
