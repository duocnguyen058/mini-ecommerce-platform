package com.miniecommerce.catalog.shared;

import java.net.URI;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
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
		return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
	}
}
