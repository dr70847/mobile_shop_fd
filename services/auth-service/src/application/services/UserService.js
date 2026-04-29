const { createUser, normalizeEmail } = require("../../domain/user/User");

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function unauthorized(message) {
  const err = new Error(message);
  err.status = 401;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

/**
 * Application service (use-cases) for Users.
 *
 * @param {{
 *  userRepo: {findByEmail:(email:string)=>Promise<any>, findById:(id:number)=>Promise<any>, create:(x:any)=>Promise<{id:number}>},
 *  passwordHasher: {hash:(p:string)=>Promise<string>, compare:(p:string, hash:string)=>Promise<boolean>},
 *  tokenService: {sign:(claims:any)=>string}
 * }} deps
 */
function createUserService({ userRepo, passwordHasher, tokenService }) {
  function signTokenFromUser(user) {
    return tokenService.sign({
      id: user.id,
      email: user.email,
      name: user.name || "",
      is_admin: Boolean(user.is_admin),
    });
  }

  async function signup({ name, email, password }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || "");

    const existing = await userRepo.findByEmail(cleanEmail);
    if (existing) throw conflict("Email is already registered.");

    const passwordHash = await passwordHasher.hash(cleanPassword);
    const created = await userRepo.create({ name: cleanName, email: cleanEmail, passwordHash });
    const user = createUser({ id: created.id, name: cleanName, email: cleanEmail, isAdmin: false });

    return { token: signTokenFromUser(user), user };
  }

  async function login({ email, password }) {
    const cleanEmail = normalizeEmail(email);
    const cleanPassword = String(password || "");

    const userRow = await userRepo.findByEmail(cleanEmail);
    if (!userRow) throw unauthorized("Invalid email or password.");

    const hash = userRow.password_hash || userRow.PASSWORD || "";
    const ok = await passwordHasher.compare(cleanPassword, hash);
    if (!ok) throw unauthorized("Invalid email or password.");

    const user = createUser({
      id: userRow.id,
      name: userRow.name || userRow.NAME,
      email: userRow.email,
      isAdmin: userRow.is_admin,
    });
    return { token: signTokenFromUser(user), user };
  }

  async function me(userId) {
    const id = Number(userId);
    const row = await userRepo.findById(id);
    if (!row) throw notFound("User not found.");
    const user = createUser({ id: row.id, name: row.name, email: row.email, isAdmin: row.is_admin });
    return { user };
  }

  return { signup, login, me };
}

module.exports = { createUserService };

