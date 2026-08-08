package com.miniecommerce.cart.shared.exception;

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
