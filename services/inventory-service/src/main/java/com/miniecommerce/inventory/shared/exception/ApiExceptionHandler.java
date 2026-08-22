package com.miniecommerce.inventory.shared.exception;

import java.net.URI;
import java.time.Instant;

import org.springframework.dao.OptimisticLockingFailureException;
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

	@ExceptionHandler(InvalidInventoryRequestException.class)
	ProblemDetail handleInvalidRequest(InvalidInventoryRequestException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.BAD_REQUEST,
			exception.getMessage()
		);
		problem.setTitle("Yêu cầu không hợp lệ");
		problem.setType(URI.create("urn:problem:invalid-request"));
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

	@ExceptionHandler(OptimisticLockingFailureException.class)
	ProblemDetail handleOptimisticLock(OptimisticLockingFailureException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			"Cập nhật kho thất bại do xung đột đồng thời, vui lòng thử lại."
		);
		problem.setTitle("Xung đột đồng thời");
		problem.setType(URI.create("urn:problem:concurrent-conflict"));
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

	@ExceptionHandler(IllegalStateException.class)
	ProblemDetail handleIllegalState(IllegalStateException exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.CONFLICT,
			exception.getMessage()
		);
		problem.setTitle("Thao tác không hợp lệ");
		problem.setType(URI.create("urn:problem:invalid-state"));
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

	@ExceptionHandler({org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
	ProblemDetail handleTypeMismatch(Exception exception) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(
			HttpStatus.BAD_REQUEST,
			"Tham số không hợp lệ: " + exception.getMessage()
		);
		problem.setTitle("Tham số không hợp lệ");
		problem.setType(URI.create("urn:problem:bad-request"));
		problem.setProperty("timestamp", Instant.now());
		return problem;
	}
}
