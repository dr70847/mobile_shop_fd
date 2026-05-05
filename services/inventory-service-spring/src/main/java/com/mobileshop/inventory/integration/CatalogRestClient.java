package com.mobileshop.inventory.integration;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Thirrje sinkrone REST ndër-modulare drejt catalog-service; e mbrojtur me Resilience4j (Circuit Breaker).
 */
@Service
public class CatalogRestClient {

  private final RestClient restClient;

  public CatalogRestClient(@Value("${mobileshop.catalog.base-url:http://localhost:4002}") String baseUrl) {
    this.restClient = RestClient.builder().baseUrl(baseUrl).build();
  }

  @CircuitBreaker(name = "catalogRest", fallbackMethod = "fallbackProductName")
  public Optional<String> fetchProductName(long productId) {
    try {
      @SuppressWarnings("unchecked")
      Map<String, Object> body =
          restClient
              .get()
              .uri("/products/{id}", productId)
              .retrieve()
              .body(Map.class);
      if (body == null || body.get("name") == null) {
        return Optional.empty();
      }
      return Optional.of(String.valueOf(body.get("name")));
    } catch (RestClientException ex) {
      throw ex;
    }
  }

  public Optional<String> fallbackProductName(long productId, Throwable t) {
    return Optional.empty();
  }
}
