package com.mobileshop.inventory.integration;

import com.mobileshop.inventory.config.RabbitMqTopologyConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Konsumon ngjarje të publikuara njësoj në RabbitMQ nga order-service (async messaging).
 */
@Component
public class OrderCreatedRabbitListener {

  private static final Logger log = LoggerFactory.getLogger(OrderCreatedRabbitListener.class);

  @RabbitListener(queues = RabbitMqTopologyConfig.INVENTORY_ORDERS_CREATED_QUEUE)
  public void onOrderCreated(String jsonPayload) {
    log.info("[RabbitMQ consumer] orders.created received (inventory-service): {}", jsonPayload);
  }
}
