const app = require("./routes/api.js");

const PORT = 3000;

app.listen(PORT, () => {
  console.log("App is running: http://localhost:3000");
});
