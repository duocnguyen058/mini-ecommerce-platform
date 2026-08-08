package com.miniecommerce.catalog.shared;

import java.net.URI;
import java.time.Instant;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.NOT_FOUND,
			exception.getMessage()
		);
		problem.setTitle("Không tìm thấy tài nguyên");
		problem.setType(URI.create("urn:problem:resource-not-found"));
		problem.setProperty("timestamp", Instant.now());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	ResponseEntity<ProblemDetail> handleConflict(DataIntegrityViolationException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			"SKU hoặc slug đã tồn tại."
		);
		problem.setTitle("Dữ liệu bị trùng");
		problem.setType(URI.create("urn:problem:data-conflict"));
		problem.setProperty("timestamp", Instant.now());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.FORBIDDEN,
			"Bạn không có quyền thực hiện thao tác này."
		);
		problem.setTitle("Truy cập bị từ chối");
		problem.setType(URI.create("urn:problem:access-denied"));
		problem.setProperty("timestamp", Instant.now());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ProblemDetail> handleValidationErrors(MethodArgumentNotValidException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.BAD_REQUEST,
			"Dữ liệu không hợp lệ"
		);
		problem.setTitle("Xác thực thất bại");
		problem.setType(URI.create("urn:problem:validation-failed"));
		problem.setProperty("timestamp", Instant.now());
		problem.setProperty("errors", exception.getBindingResult().getFieldErrors().stream()
			.map(error -> error.getField() + ": " + error.getDefaultMessage())
			.toList());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
	}
}
