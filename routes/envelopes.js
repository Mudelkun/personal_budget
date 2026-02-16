const express = require("express");
const envelopesRoute = express.Router();

module.exports = {
  envelopesRoute,
};

const {
  validateEnvlope,
  findEnvelope,
  requireBody,
} = require("./middleware.js");

const {
  getData,
  updateData,
  deleteData,
  saveData,
  getDataById,
} = require("./utiles.js");

envelopesRoute.param("envelopeId", findEnvelope);

envelopesRoute.post("/", requireBody, validateEnvlope, (req, res, next) => {
  try {
    const newEnvelope = saveData("envelopes", {
      name: req.name,
      amountCents: req.amountCents,
    });
    res.status(201).json({
      success: true,
      data: newEnvelope,
    });
  } catch (err) {
    next(err);
  }
});

envelopesRoute.get("/", (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      envelopes: getData("envelopes"),
    });
  } catch (err) {
    next(err);
  }
});

envelopesRoute.get("/:envelopeId", (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      envelope: req.envelope,
    });
  } catch (err) {
    next(err);
  }
});

// We recive an new object with all new properties
// we need to validate the object first
// then update
envelopesRoute.put(
  "/:envelopeId",
  requireBody,
  validateEnvlope,
  (req, res, next) => {
    try {
      const update = {
        id: req.envelope.id,
        name: req.name,
        amountCents: req.amountCents,
      };
      const updatedEnvelope = updateData("envelopes", req.envelope.id, update);
      res.status(200).json({
        success: true,
        updatedEnvelope: updatedEnvelope,
      });
    } catch (err) {
      next(err);
    }
  },
);

envelopesRoute.delete("/:envelopeId", (req, res, next) => {
  try {
    deleteData("envelopes", req.envelope.id);
    res.status(200).json({ success: true, message: "Envelope deleted" });
  } catch (err) {
    next(err);
  }
});
