const { sanitizeInput, sqlInjectionProtection } = require("../../middleware/security");

function createRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("security middleware", () => {
  describe("sanitizeInput", () => {
    test("strips script tags from nested body strings", () => {
      const req = {
        body: { name: '<script>alert(1)</script>Alice' },
        query: {},
        params: {},
      };
      const res = createRes();
      let nextCalled = false;
      sanitizeInput(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
      expect(req.body.name).not.toMatch(/<script/i);
    });
  });

  describe("sqlInjectionProtection", () => {
    test("blocks obvious SQL keywords in body", () => {
      const req = {
        body: { q: "SELECT * FROM users" },
        query: {},
        params: {},
      };
      const res = createRes();
      let nextCalled = false;
      sqlInjectionProtection(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(400);
      expect(res.body?.message).toBe("Invalid input detected");
    });

    test("allows normal product search strings", () => {
      const req = {
        body: {},
        query: { search: "Samsung Galaxy" },
        params: {},
      };
      const res = createRes();
      let nextCalled = false;
      sqlInjectionProtection(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
    });
  });
});
