package com.mobileshop.inventory.persistence;

import com.mobileshop.inventory.domain.InventoryItem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryItemRepository
    extends JpaRepository<InventoryItem, Long>, JpaSpecificationExecutor<InventoryItem> {
  Optional<InventoryItem> findFirstByProductId(Integer productId);
}

