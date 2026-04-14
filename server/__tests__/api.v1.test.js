const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => "hashed"),
}));

jest.mock("../models/User", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));

jest.mock("../models/Product", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../models/Order", () => ({
  getAll: jest.fn(),
  getByUserId: jest.fn(),
  createWithItems: jest.fn(),
}));

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const app = require("../app");

describe("API v1 Auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/v1/auth/login returns JWT response", async () => {
    User.findByEmail.mockImplementation((_email, cb) =>
      cb(null, [{ id: 1, NAME: "Jane", email: "jane@mail.com", PASSWORD: "$2b$10$e0NRSMYlW0ed89ZNPfAhbe7Jh5K2I8k1sA2pM8NQBoLUhTR3FXg8K", is_admin: 0 }])
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "jane@mail.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body._links).toBeDefined();
  });

  test("POST /api/v1/auth/oauth/token returns OAuth2 shape", async () => {
    User.findByEmail.mockImplementation((_email, cb) =>
      cb(null, [{ id: 2, NAME: "John", email: "john@mail.com", PASSWORD: "$2b$10$e0NRSMYlW0ed89ZNPfAhbe7Jh5K2I8k1sA2pM8NQBoLUhTR3FXg8K", is_admin: 1 }])
    );

    const res = await request(app)
      .post("/api/v1/auth/oauth/token")
      .send({ grant_type: "password", username: "john@mail.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.token_type).toBe("Bearer");
  });
});

describe("API v1 Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/v1/products returns HATEOAS payload", async () => {
    Product.getAll.mockImplementation((cb) => cb(null, [{ id: 10, name: "Phone X", price: 699 }]));

    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]._links.self.href).toContain("/api/v1/products/10");
  });

  test("POST /api/v1/products requires JWT admin", async () => {
    const token = jwt.sign({ id: 1, is_admin: true }, process.env.JWT_SECRET);
    Product.create.mockImplementation((_payload, cb) => cb(null, { insertId: 33 }));
    Product.getById.mockImplementation((_id, cb) => cb(null, [{ id: 33, name: "New phone", price: 100 }]));

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New phone", price: 100, stock: 3 });

    expect(res.status).toBe(201);
    expect(res.body._links).toBeDefined();
  });
});

describe("API v1 Orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/v1/orders/my returns user orders", async () => {
    const token = jwt.sign({ id: 7, is_admin: false }, process.env.JWT_SECRET);
    Order.getByUserId.mockImplementation((_userId, cb) => cb(null, [{ id: 88, user_id: 7, total_price: 300 }]));

    const res = await request(app)
      .get("/api/v1/orders/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items[0]._links).toBeDefined();
  });

  test("POST /api/v1/orders/checkout creates order", async () => {
    const token = jwt.sign({ id: 7, is_admin: false }, process.env.JWT_SECRET);
    Product.getByIds.mockImplementation((_ids, cb) => cb(null, [{ id: 1, price: 200 }]));
    Order.createWithItems.mockImplementation((_payload, cb) => cb(null, { orderId: 55 }));

    const res = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ product_id: 1, quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(55);
    expect(res.body._links.self.href).toContain("/api/v1/orders/55");
  });
});
