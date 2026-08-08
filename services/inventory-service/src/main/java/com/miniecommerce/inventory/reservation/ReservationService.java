package com.miniecommerce.inventory.reservation;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import com.miniecommerce.inventory.shared.exception.InsufficientStockException;
import com.miniecommerce.inventory.shared.exception.ResourceNotFoundException;
import com.miniecommerce.inventory.stock.InventoryItem;
import com.miniecommerce.inventory.stock.InventoryItemRepository;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final int MAX_RESERVE_ATTEMPTS = 3;
    private static final Duration DEFAULT_RESERVATION_TTL = Duration.ofMinutes(15);

    private final ReservationRepository reservationRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            InventoryItemRepository inventoryItemRepository) {
        this.reservationRepository = reservationRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    /**
     * Giữ hàng — retry khi optimistic lock xung đột.
     * Mỗi lần thử gọi tryReserve() với @Transactional(REQUIRES_NEW).
     */
    public ReservationResponse reserve(ReserveRequest request) {
        InsufficientStockException insufficient = null;
        for (int attempt = 1; attempt <= MAX_RESERVE_ATTEMPTS; attempt++) {
            try {
                return tryReserve(request);
            }
            catch (InsufficientStockException exception) {
                insufficient = exception;
            }
            catch (OptimisticLockingFailureException exception) {
                // xung đột — thử lại
            }
        }
        if (insufficient != null) {
            throw insufficient;
        }
        throw new OptimisticLockingFailureException(
                "Không thể giữ hàng sau " + MAX_RESERVE_ATTEMPTS + " lần thử (xung đột đồng thời).");
    }

    /**
     * Thử giữ hàng 1 lần — REQUIRES_NEW để mỗi lần thử là transaction độc lập.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ReservationResponse tryReserve(ReserveRequest request) {
        InventoryItem item = inventoryItemRepository.findByProductId(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy tồn kho của sản phẩm " + request.productId()));

        if (request.quantity() > item.getAvailableQuantity()) {
            throw new InsufficientStockException(
                    "Số lượng yêu cầu (%d) vượt quá tồn khả dụng (%d) của sản phẩm %s."
                            .formatted(request.quantity(), item.getAvailableQuantity(), request.productId()));
        }

        item.reserve(request.quantity());
        inventoryItemRepository.save(item);

        Reservation reservation = new Reservation(
                item, request.quantity(), request.orderId(), Instant.now().plus(DEFAULT_RESERVATION_TTL));
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse confirm(UUID reservationId) {
        Reservation reservation = reservationRepository.findByIdAndStatus(reservationId, ReservationStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy reservation đang chờ " + reservationId));

        InventoryItem item = reservation.getInventoryItem();
        item.confirmSale(reservation.getQuantity());
        inventoryItemRepository.save(item);

        reservation.markConfirmed();
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse cancel(UUID reservationId) {
        Reservation reservation = reservationRepository.findByIdAndStatus(reservationId, ReservationStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy reservation đang chờ " + reservationId));

        InventoryItem item = reservation.getInventoryItem();
        item.release(reservation.getQuantity());
        inventoryItemRepository.save(item);

        reservation.markCancelled();
        return ReservationResponse.from(reservationRepository.save(reservation));
    }
}
