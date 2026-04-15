package com.mobileshop.inventory;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("status", "ok", "service", "inventory-service-spring");
  }

  @GetMapping("/products/{id}/stock")
  public Map<String, Object> stock(@PathVariable int id) {
    return Map.of("productId", id, "availableStock", 50, "source", "spring-boot");
  }
}
