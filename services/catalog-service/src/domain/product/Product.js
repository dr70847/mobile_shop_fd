function toInt(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNumber(value, fallback = NaN) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function createProductDraft(input) {
  const name = String(input?.name || "").trim();
  const description = String(input?.description || "").trim();
  const price = toNumber(input?.price);
  const stock = Math.max(0, toInt(input?.stock, 0));

  return { name, description, price, stock };
}

module.exports = { createProductDraft };

