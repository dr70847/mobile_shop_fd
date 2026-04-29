/**
 * Domain port (interface) for user persistence.
 *
 * Implementations live in infrastructure (e.g. MySQL).
 *
 * @typedef {Object} UserRow
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {boolean|number} is_admin
 * @property {string=} password_hash
 *
 * @interface
 */
class UserRepository {
  /** @param {string} email @returns {Promise<UserRow|null>} */
  // eslint-disable-next-line no-unused-vars
  async findByEmail(email) {}

  /** @param {number} id @returns {Promise<UserRow|null>} */
  // eslint-disable-next-line no-unused-vars
  async findById(id) {}

  /**
   * @param {{name:string,email:string,passwordHash:string}} input
   * @returns {Promise<{id:number}>}
   */
  // eslint-disable-next-line no-unused-vars
  async create(input) {}
}

module.exports = { UserRepository };

