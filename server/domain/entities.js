class BaseEntity {
  constructor({ id = null, createdAt = null, updatedAt = null } = {}) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  validateIdentity() {
    if (this.id != null && (!Number.isInteger(this.id) || this.id <= 0)) {
      throw new Error("Invalid entity id.");
    }
  }
}

class UserEntity extends BaseEntity {
  constructor({ name, email, isAdmin = false, ...rest }) {
    super(rest);
    this.name = String(name || "").trim();
    this.email = String(email || "").trim().toLowerCase();
    this.isAdmin = Boolean(isAdmin);
  }

  validateProfile() {
    this.validateIdentity();
    if (!this.name) throw new Error("Name is required.");
    if (this.name.length < 2) throw new Error("Name must be at least 2 characters.");
    if (this.name.length > 80) throw new Error("Name is too long.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) throw new Error("Valid email is required.");
  }
}

class CustomerEntity extends UserEntity {
  constructor({ loyaltyPoints = 0, tier = "standard", ...rest }) {
    super(rest);
    this.loyaltyPoints = Number(loyaltyPoints) || 0;
    this.tier = String(tier || "standard").toLowerCase();
  }

  canCheckout() {
    return this.loyaltyPoints >= 0;
  }
}

class AdminEntity extends UserEntity {
  constructor({ permissions = [], ...rest }) {
    super({ isAdmin: true, ...rest });
    this.permissions = Array.isArray(permissions) ? permissions : [];
  }

  canManageCatalog() {
    return this.isAdmin;
  }
}

class ProductEntity extends BaseEntity {
  constructor({ name, description = "", price, stock = 0, ...rest }) {
    super(rest);
    this.name = String(name || "").trim();
    this.description = String(description || "").trim();
    this.price = Number(price);
    this.stock = Number.isFinite(Number(stock)) ? Math.max(0, Number.parseInt(String(stock), 10)) : 0;
  }

  validatePricing() {
    this.validateIdentity();
    if (!this.name) throw new Error("Product name is required.");
    if (this.name.length > 140) throw new Error("Product name is too long.");
    if (!Number.isFinite(this.price) || this.price < 0) {
      throw new Error("Valid product price is required.");
    }
    if (!Number.isInteger(this.stock) || this.stock < 0) {
      throw new Error("Stock must be a non-negative integer.");
    }
  }
}

class PhysicalProductEntity extends ProductEntity {
  constructor({ weightKg = 0, ...rest }) {
    super(rest);
    this.weightKg = Number(weightKg) || 0;
  }
}

class DigitalProductEntity extends ProductEntity {
  constructor({ licenseType = "single-user", ...rest }) {
    super(rest);
    this.licenseType = String(licenseType || "single-user");
  }
}

class AddressValueObject {
  constructor({ country, city, zipCode = "", street } = {}) {
    this.country = String(country || "").trim();
    this.city = String(city || "").trim();
    this.zipCode = String(zipCode || "").trim();
    this.street = String(street || "").trim();
  }

  validate() {
    if (!this.country || !this.city || !this.street) {
      throw new Error("Shipping address requires country, city, and street.");
    }
    if (this.zipCode && this.zipCode.length > 20) {
      throw new Error("Invalid zip/postal code.");
    }
  }
}

class OrderItemEntity extends BaseEntity {
  constructor({ product_id, quantity, unit_price, productSnapshot = null, ...rest }) {
    super(rest);
    this.product_id = Number(product_id);
    this.quantity = Number(quantity);
    this.unit_price = Number(unit_price);
    this.productSnapshot = productSnapshot;
  }

  calculateLineTotal() {
    return Number((this.quantity * this.unit_price).toFixed(2));
  }

  validate() {
    if (!Number.isInteger(this.product_id) || this.product_id <= 0) {
      throw new Error("Invalid product_id in order item.");
    }
    if (!Number.isFinite(this.quantity) || this.quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }
    if (!Number.isFinite(this.unit_price) || this.unit_price < 0) {
      throw new Error("Unit price must be a non-negative number.");
    }
  }
}

class OrderEntity extends BaseEntity {
  constructor({ userId, items = [], shippingAddress = null, status = "NEW", ...rest }) {
    super(rest);
    this.userId = Number(userId);
    this.items = items;
    this.shippingAddress = shippingAddress ? new AddressValueObject(shippingAddress) : null;
    this.status = String(status || "NEW").toUpperCase();
  }

  static allowedStatusTransitions() {
    return {
      NEW: ["PENDING_PAYMENT", "CANCELLED"],
      PENDING_PAYMENT: ["PAID", "CANCELLED"],
      PAID: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };
  }

  canTransitionTo(nextStatus) {
    const current = String(this.status || "").toUpperCase();
    const next = String(nextStatus || "").toUpperCase();
    const allowed = OrderEntity.allowedStatusTransitions()[current] || [];
    return allowed.includes(next);
  }

  validateCheckout() {
    if (!Number.isInteger(this.userId) || this.userId <= 0) {
      throw new Error("Invalid user for checkout.");
    }
    if (!Array.isArray(this.items) || this.items.length === 0) {
      throw new Error("Cart is empty.");
    }
    for (const item of this.items) {
      item.validate();
    }
    if (this.shippingAddress) {
      this.shippingAddress.validate();
    }
  }

  totalAmount() {
    return Number(this.items.reduce((sum, item) => sum + item.calculateLineTotal(), 0).toFixed(2));
  }
}

class PaymentEntity extends BaseEntity {
  constructor({ orderId, amount, status = "PENDING", ...rest }) {
    super(rest);
    this.orderId = Number(orderId);
    this.amount = Number(amount);
    this.status = String(status || "PENDING").toUpperCase();
  }

  authorize() {
    if (!Number.isInteger(this.orderId) || this.orderId <= 0) {
      throw new Error("Invalid order id for payment.");
    }
    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      throw new Error("Invalid payment amount.");
    }
    this.status = "AUTHORIZED";
    return this.status;
  }
}

class CardPaymentEntity extends PaymentEntity {}
class WalletPaymentEntity extends PaymentEntity {}

function normalizeUserForRole(payload) {
  return payload?.isAdmin ? new AdminEntity(payload) : new CustomerEntity(payload);
}

module.exports = {
  BaseEntity,
  UserEntity,
  CustomerEntity,
  AdminEntity,
  ProductEntity,
  PhysicalProductEntity,
  DigitalProductEntity,
  AddressValueObject,
  OrderItemEntity,
  OrderEntity,
  PaymentEntity,
  CardPaymentEntity,
  WalletPaymentEntity,
  normalizeUserForRole,
};
