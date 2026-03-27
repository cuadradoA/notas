const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// rutas base
app.use("/api", require("./presentation/routes"));

module.exports = app;