const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const productsRoutes = require("./presentation/productsRoutes");
const { startCatalogGrpcServer } = require("./integration/grpcCatalogServer");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "catalog-service" });
});

app.use("/products", productsRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 4002;
app.listen(port, () => {
  console.log(`catalog-service running on http://localhost:${port}`);
});

startCatalogGrpcServer();
