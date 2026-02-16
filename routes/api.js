const express = require("express");
const app = express();

module.exports = app;

app.use(express.json());

const { findEnvelope } = require("./middleware.js");

const { budgetRoute } = require("./budget.js");
const { envelopesRoute } = require("./envelopes.js");
const { spendingsRoute } = require("./spendings.js");

app.param("envelopeId", findEnvelope);
app.use("/budget", budgetRoute);
app.use("/envelopes", envelopesRoute);
app.use("/spendings", spendingsRoute);

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});
