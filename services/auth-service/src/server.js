const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./presentation/authRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});
app.use("/auth", authRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(port, () => {
  console.log(`auth-service running on http://localhost:${port}`);
});
