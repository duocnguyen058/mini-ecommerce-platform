package com.miniecommerce.order.shared.exception;

public class InvalidOrderRequestException extends RuntimeException {

	public InvalidOrderRequestException(String message) {
		super(message);
	}
}
