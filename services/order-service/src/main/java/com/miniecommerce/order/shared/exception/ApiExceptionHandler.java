package com.miniecommerce.order.shared.exception;

import java.net.URI;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	ProblemDetail handleNotFound(ResourceNotFoundException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.NOT_FOUND,
			exception.getMessage()
		);
		problem.setTitle("Không tìm thấy tài nguyên");
		problem.setType(URI.create("urn:problem:resource-not-found"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(OrderStateException.class)
	ProblemDetail handleOrderState(OrderStateException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			exception.getMessage()
		);
		problem.setTitle("Trạng thái đơn hàng không hợp lệ");
		problem.setType(URI.create("urn:problem:invalid-order-state"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(InsufficientStockException.class)
	ProblemDetail handleInsufficientStock(InsufficientStockException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			exception.getMessage()
		);
		problem.setTitle("Không đủ hàng trong kho");
		problem.setType(URI.create("urn:problem:insufficient-stock"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(InvalidOrderRequestException.class)
	ProblemDetail handleInvalidOrderRequest(InvalidOrderRequestException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.BAD_REQUEST,
			exception.getMessage()
		);
		problem.setTitle("Yêu cầu đặt hàng không hợp lệ");
		problem.setType(URI.create("urn:problem:invalid-order-request"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(RemoteServiceException.class)
	ProblemDetail handleRemoteService(RemoteServiceException exception) {
		HttpStatus status = exception.getStatusCode() >= 400 && exception.getStatusCode() < 600
			? HttpStatus.valueOf(exception.getStatusCode())
			: HttpStatus.SERVICE_UNAVAILABLE;
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
		problem.setTitle("Lỗi từ dịch vụ phụ thuộc");
		problem.setType(URI.create("urn:problem:remote-service-error"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(AccessDeniedException.class)
	ProblemDetail handleAccessDenied(AccessDeniedException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.FORBIDDEN,
			"Bạn không có quyền thực hiện thao tác này."
		);
		problem.setTitle("Truy cập bị từ chối");
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ProblemDetail handleValidationErrors(MethodArgumentNotValidException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.BAD_REQUEST,
			"Dữ liệu không hợp lệ"
		);
		problem.setTitle("Xác thực thất bại");
		problem.setProperty("timestamp", Instant.now());
		problem.setProperty("errors", exception.getBindingResult().getFieldErrors().stream()
			.map(error -> error.getField() + ": " + error.getDefaultMessage())
			.toList());
		return problem;
	}
}
