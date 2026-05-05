package com.mobileshop.inventory.http;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate limiting në nivel API me Bucket4j (hedh 429 kur kufiri tejkalohet).
 */
@Component
@Order(30)
public class ApiRateLimiterFilter extends OncePerRequestFilter {

  private final ConcurrentHashMap<String, Bucket> cache = new ConcurrentHashMap<>();
  private final int perMinute;

  public ApiRateLimiterFilter(@Value("${mobileshop.ratelimit.requests-per-minute:120}") int perMinute) {
    this.perMinute = Math.max(10, perMinute);
  }

  private Bucket newBucket() {
    return Bucket.builder().addLimit(Bandwidth.simple(perMinute, Duration.ofMinutes(1))).build();
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return path.startsWith("/actuator");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String key = request.getRemoteAddr();
    Bucket bucket = cache.computeIfAbsent(key, k -> newBucket());
    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
      return;
    }
    response.setStatus(429);
    response.setContentType("application/json");
    response.getWriter().write("{\"error\":\"rate limit exceeded\"}");
  }
}
