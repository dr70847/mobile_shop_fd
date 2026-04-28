const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";
process.env.ACCESS_TOKEN_TTL = "15m";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => "hashed"),
}));

jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "TESTSECRET"),
  generateURI: jest.fn(() => "otpauth://totp/MobileShop:test?secret=TESTSECRET"),
  verifySync: jest.fn(() => ({ valid: true, delta: 0 })),
}));

jest.mock("../models/User", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdWithSecrets: jest.fn(),
  saveTwoFactorSetup: jest.fn(),
  enableTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
}));

jest.mock("../models/RefreshToken", () => ({
  sha256Hex: jest.fn((val) => `hash:${val}`),
  create: jest.fn((_payload, cb) => cb(null, { insertId: 1 })),
  findValidByHash: jest.fn(),
  revokeByHash: jest.fn((_hash, cb) => cb(null, { affectedRows: 1 })),
  revokeAllForUser: jest.fn((_userId, cb) => cb(null, { affectedRows: 1 })),
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
const RefreshToken = require("../models/RefreshToken");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { verifySync } = require("otplib");
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
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.expiresIn).toBe(15 * 60);
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
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.token_type).toBe("Bearer");
    expect(res.body.expires_in).toBe(15 * 60);
  });

  test("POST /api/v1/auth/login returns 2FA challenge when enabled", async () => {
    User.findByEmail.mockImplementation((_email, cb) =>
      cb(null, [
        {
          id: 4,
          NAME: "Mira",
          email: "mira@mail.com",
          PASSWORD: "hashed-password",
          is_admin: 0,
          two_factor_enabled: 1,
          two_factor_secret: "TESTSECRET",
        },
      ])
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "mira@mail.com", password: "password123" });

    expect(res.status).toBe(202);
    expect(res.body.requiresTwoFactor).toBe(true);
    expect(res.body.twoFactorToken).toBeDefined();
  });

  test("POST /api/v1/auth/2fa/verify-login returns JWT after valid code", async () => {
    const twoFactorToken = jwt.sign(
      {
        id: 5,
        email: "lisa@mail.com",
        purpose: "2fa-login",
      },
      process.env.JWT_SECRET
    );
    User.findByIdWithSecrets.mockImplementation((_id, cb) =>
      cb(null, [
        {
          id: 5,
          NAME: "Lisa",
          email: "lisa@mail.com",
          is_admin: 0,
          two_factor_enabled: 1,
          two_factor_secret: "TESTSECRET",
        },
      ])
    );
    verifySync.mockReturnValue({ valid: true, delta: 0 });

    const res = await request(app)
      .post("/api/v1/auth/2fa/verify-login")
      .send({ twoFactorToken, code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(verifySync).toHaveBeenCalledWith({
      secret: "TESTSECRET",
      token: "123456",
      epochTolerance: 30,
    });
  });

  test("POST /api/v1/auth/refresh rotates refresh token", async () => {
    RefreshToken.findValidByHash.mockImplementation((_hash, cb) =>
      cb(null, [{ id: 10, user_id: 3, token_hash: "hash:old", expires_at: new Date(Date.now() + 100000), revoked_at: null }])
    );
    User.findById.mockImplementation((_id, cb) =>
      cb(null, [{ id: 3, NAME: "Nora", email: "nora@mail.com", is_admin: 0, created_at: new Date(), two_factor_enabled: 0 }])
    );

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "old-refresh" });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.expiresIn).toBe(15 * 60);
  });

  test("POST /api/v1/auth/oauth/token supports refresh_token grant", async () => {
    RefreshToken.findValidByHash.mockImplementation((_hash, cb) =>
      cb(null, [{ id: 11, user_id: 6, token_hash: "hash:rt", expires_at: new Date(Date.now() + 100000), revoked_at: null }])
    );
    User.findById.mockImplementation((_id, cb) =>
      cb(null, [{ id: 6, NAME: "Arta", email: "arta@mail.com", is_admin: 1, created_at: new Date(), two_factor_enabled: 0 }])
    );

    const res = await request(app)
      .post("/api/v1/auth/oauth/token")
      .send({ grant_type: "refresh_token", refresh_token: "rt-123" });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.token_type).toBe("Bearer");
    expect(res.body.expires_in).toBe(15 * 60);
  });

  test("POST /api/v1/auth/logout revokes refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: "to-revoke" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out.");
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
