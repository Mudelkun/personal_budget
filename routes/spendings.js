const express = require("express");
const spendingsRoute = express.Router();
module.exports = { spendingsRoute };

const { getData, deleteData, saveData, getDataById } = require("./utiles.js");
const {
  validateSpending,
  findEnvelope,
  requireBody,
} = require("./middleware.js");
const { get } = require("./api.js");

spendingsRoute.param("envelopeId", findEnvelope);

spendingsRoute.get("/", (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      spendings: getData("spendings"),
    });
  } catch (err) {
    next(err);
  }
});

// Get all spendings for a specific envelope
spendingsRoute.get("/:envelopeId", (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      envelope: req.envelope,
      spendings: getData("spendings", req.envelope.id),
    });
  } catch (err) {
    next(err);
  }
});

// get for wich envelope spending is for
// validate spending by checking if the spending amount is less then reamingEnvelopeAmountCents
// push the spending
spendingsRoute.post(
  "/:envelopeId",
  requireBody,
  validateSpending,
  (req, res, next) => {
    // dataToSave {name:, amountCents:, envelopeId:}
    try {
      const newSpending = {
        name: req.spendingName,
        amountCents: req.spendingAmountCents,
        envelopeId: req.envelope.id,
      };
      res.status(200).json({
        success: true,
        spending: saveData("spendings", newSpending),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Delete all spendings for a specific envelope
spendingsRoute.delete("/All/:envelopeId", (req, res, next) => {
  try {
    deleteData("Allspendings", req.envelope.id);
    res.status(200).json({
      success: true,
      message: `All spendings for ${req.envelope.name} envelope were successfully deleted`,
    });
  } catch (err) {
    next(err);
  }
});

// Delete all spendings for all envelopes
spendingsRoute.delete("/", (req, res, next) => {
  try {
    deleteData("spendings");
    res.status(200).json({
      success: true,
      message: "Spendings were successfully reset",
    });
  } catch (err) {
    next(err);
  }
});

// delete a specific spending
spendingsRoute.delete("/:spendingId", (req, res, next) => {
  try {
    const id = req.params.spendingId;
    const spending = getDataById("spendings", id);
    deleteData("spendings", id, true);
    res.status(200).json({
      success: true,
      message: `${spending.name} was successfully deleted`,
    });
  } catch (err) {
    next(err);
  }
});
