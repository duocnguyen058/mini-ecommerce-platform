package com.miniecommerce.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String ORDER_EVENTS_QUEUE = "order.events.notification";
    public static final String ORDER_EVENTS_EXCHANGE = "order.events";
    public static final String ROUTING_KEY_WILDCARD = "order.#";
    
    @Bean
    Queue notificationQueue() { 
        return new Queue(ORDER_EVENTS_QUEUE, true); 
    }
    
    @Bean
    TopicExchange orderEventsExchange() { 
        return new TopicExchange(ORDER_EVENTS_EXCHANGE); 
    }
    
    @Bean
    Binding binding(Queue q, TopicExchange ex) { 
        return BindingBuilder.bind(q).to(ex).with(ROUTING_KEY_WILDCARD); 
    }
    
    @Bean
    MessageConverter messageConverter() { 
        return new JacksonJsonMessageConverter(); 
    }
}
