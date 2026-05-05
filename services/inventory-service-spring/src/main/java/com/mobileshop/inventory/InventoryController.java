package com.mobileshop.inventory;

import java.util.LinkedHashMap;
import java.util.Map;
import com.mobileshop.inventory.application.InventoryQueryService;
import com.mobileshop.inventory.integration.CatalogRestClient;
import com.mobileshop.inventory.domain.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
  private final InventoryQueryService inventory;
  private final CatalogRestClient catalog;

  public InventoryController(InventoryQueryService inventory, CatalogRestClient catalog) {
    this.inventory = inventory;
    this.catalog = catalog;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("status", "ok", "service", "inventory-service-spring");
  }

  @GetMapping("/products/{id}/stock")
  public Map<String, Object> stock(@PathVariable int id) {
    int available =
        inventory.findByProductId(id).map(InventoryItem::getAvailableStock).orElse(0);
    LinkedHashMap<String, Object> body = new LinkedHashMap<>();
    body.put("productId", id);
    body.put("availableStock", available);
    body.put("source", "hibernate-jpa");
    catalog.fetchProductName(id).ifPresent(name -> body.put("catalogProductNameViaRestCircuitBreaker", name));
    return body;
  }

  @GetMapping("/items")
  public Page<InventoryItem> items(
      @RequestParam(required = false) Integer productId,
      @RequestParam(required = false) Integer minStock,
      @RequestParam(required = false) Integer maxStock,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int limit,
      @RequestParam(defaultValue = "updatedAt") String sort,
      @RequestParam(defaultValue = "desc") String dir) {
    int safePage = Math.max(1, page);
    int safeLimit = Math.min(Math.max(1, limit), 100);
    Sort.Direction direction = "asc".equalsIgnoreCase(dir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(direction, sort));
    return inventory.findPage(productId, minStock, maxStock, pageable);
  }
}
