const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const orderRoutes = require("./presentation/orderRoutes");
const { startInventoryEventConsumer } = require("./integration/inventoryEventConsumer");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

app.use("/orders", orderRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 4003;
app.listen(port, () => {
  console.log(`order-service running on http://localhost:${port}`);
});

const enableConsumer = String(process.env.ENABLE_INVENTORY_EVENT_CONSUMER || "true").toLowerCase() !== "false";
if (enableConsumer) {
  startInventoryEventConsumer();
}
