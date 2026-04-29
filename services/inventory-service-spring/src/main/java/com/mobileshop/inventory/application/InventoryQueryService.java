package com.mobileshop.inventory.application;

import com.mobileshop.inventory.domain.InventoryItem;
import com.mobileshop.inventory.persistence.InventoryItemRepository;
import com.mobileshop.inventory.persistence.InventorySpecifications;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class InventoryQueryService {
  private final InventoryItemRepository repo;

  public InventoryQueryService(InventoryItemRepository repo) {
    this.repo = repo;
  }

  public Optional<InventoryItem> findByProductId(int productId) {
    return repo.findFirstByProductId(productId);
  }

  public Page<InventoryItem> findPage(Integer productId, Integer minStock, Integer maxStock, Pageable pageable) {
    Specification<InventoryItem> spec =
        Specification.where(InventorySpecifications.productIdEquals(productId))
            .and(InventorySpecifications.stockGte(minStock))
            .and(InventorySpecifications.stockLte(maxStock));
    return repo.findAll(spec, pageable);
  }
}

