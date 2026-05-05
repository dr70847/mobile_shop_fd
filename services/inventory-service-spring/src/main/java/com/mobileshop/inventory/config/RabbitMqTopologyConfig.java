package com.mobileshop.inventory.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqTopologyConfig {

  public static final String ORDERS_EXCHANGE = "orders";
  public static final String INVENTORY_ORDERS_CREATED_QUEUE = "inventory.orders.created";
  public static final String ORDERS_CREATED_ROUTING_KEY = "orders.created";

  @Bean
  public TopicExchange ordersExchange() {
    return new TopicExchange(ORDERS_EXCHANGE, true, false);
  }

  @Bean
  public Queue inventoryOrdersCreatedQueue() {
    return new Queue(INVENTORY_ORDERS_CREATED_QUEUE, true);
  }

  @Bean
  public Binding inventoryOrdersCreatedBinding(Queue inventoryOrdersCreatedQueue, TopicExchange ordersExchange) {
    return BindingBuilder.bind(inventoryOrdersCreatedQueue).to(ordersExchange).with(ORDERS_CREATED_ROUTING_KEY);
  }
}
