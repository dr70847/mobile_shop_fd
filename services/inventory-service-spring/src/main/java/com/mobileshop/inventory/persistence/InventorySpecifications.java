package com.mobileshop.inventory.persistence;

import com.mobileshop.inventory.domain.InventoryItem;
import org.springframework.data.jpa.domain.Specification;

public final class InventorySpecifications {
  private InventorySpecifications() {}

  public static Specification<InventoryItem> productIdEquals(Integer productId) {
    return (root, _query, cb) -> productId == null ? cb.conjunction() : cb.equal(root.get("productId"), productId);
  }

  public static Specification<InventoryItem> stockGte(Integer minStock) {
    return (root, _query, cb) ->
        minStock == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("availableStock"), minStock);
  }

  public static Specification<InventoryItem> stockLte(Integer maxStock) {
    return (root, _query, cb) ->
        maxStock == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("availableStock"), maxStock);
  }
}

