const { createUserService } = require("../application/services/UserService");
const { createMySqlUserRepository } = require("../infrastructure/persistence/MySqlUserRepository");
const { createPasswordHasher } = require("../infrastructure/security/PasswordHasher");
const { createJwtTokenService } = require("../infrastructure/security/JwtTokenService");

function createContainer() {
  const userRepo = createMySqlUserRepository();
  const passwordHasher = createPasswordHasher();
  const tokenService = createJwtTokenService({ secret: process.env.JWT_SECRET, expiresIn: "7d" });

  const userService = createUserService({ userRepo, passwordHasher, tokenService });

  return { userService, tokenService };
}

module.exports = { createContainer };

