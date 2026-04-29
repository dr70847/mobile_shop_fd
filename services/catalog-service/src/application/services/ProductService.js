const { createProductDraft } = require("../../domain/product/Product");

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

/**
 * @param {{
 *  productRepo: {
 *    getAll:()=>Promise<any[]>,
 *    getById:(id:number)=>Promise<any>,
 *    create:(x:any)=>Promise<any>,
 *    update:(id:number, x:any)=>Promise<boolean>,
 *    remove:(id:number)=>Promise<boolean>,
 *  }
 * }} deps
 */
function createProductService({ productRepo }) {
  async function listProducts(query) {
    if (typeof productRepo.findPage === "function") {
      return productRepo.findPage(query);
    }
    return { data: await productRepo.getAll(), meta: { page: 1, limit: 0, total: 0, totalPages: 1 } };
  }

  async function getProduct(id) {
    return productRepo.getById(Number(id));
  }

  async function createProduct(input) {
    const draft = createProductDraft(input);
    if (!draft.name || !Number.isFinite(draft.price) || draft.price < 0) throw badRequest("Invalid product payload.");

    return productRepo.create(draft);
  }

  async function updateProduct(id, input) {
    const numericId = Number(id);
    const draft = createProductDraft(input);
    if (!Number.isFinite(numericId) || numericId <= 0 || !draft.name || !Number.isFinite(draft.price) || draft.price < 0) {
      throw badRequest("Invalid product payload.");
    }

    const updated = await productRepo.update(numericId, draft);
    if (!updated) throw notFound("Product not found.");
    return { id: numericId };
  }

  async function deleteProduct(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) throw badRequest("Invalid product id.");
    const removed = await productRepo.remove(numericId);
    if (!removed) throw notFound("Product not found.");
  }

  return { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
}

module.exports = { createProductService };

