package com.miniecommerce.inventory.stock;

import java.util.Locale;
import java.util.UUID;

import com.miniecommerce.inventory.client.catalog.CatalogClient;
import com.miniecommerce.inventory.shared.exception.InvalidInventoryRequestException;
import com.miniecommerce.inventory.shared.exception.ResourceNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Expression;

@Service
public class StockService {

	private static final Logger log = LoggerFactory.getLogger(StockService.class);

	private final InventoryItemRepository inventoryItemRepository;
	private final CatalogClient catalogClient;

	public StockService(InventoryItemRepository inventoryItemRepository, CatalogClient catalogClient) {
		this.inventoryItemRepository = inventoryItemRepository;
		this.catalogClient = catalogClient;
	}

	@Transactional
	public InventoryItemResponse create(CreateInventoryItemRequest request) {
		// Verify productId có tồn tại trong catalog-service trước khi tạo — tránh orphan record.
		if (!catalogClient.existsProduct(request.productId())) {
			throw new InvalidInventoryRequestException(
				"Product không tồn tại trong catalog: " + request.productId()
			);
		}
		int threshold = request.lowStockThreshold() == null ? 5 : request.lowStockThreshold();

		// Kiểm tra tồn tại để tránh vi phạm ràng buộc UNIQUE (product_id, sku)
		if (inventoryItemRepository.findByProductId(request.productId()).isPresent()) {
			log.warn("Inventory already exists for productId={}, abort create", request.productId());
			throw new IllegalStateException("Inventory cho sản phẩm này đã tồn tại");
		}

		InventoryItem item = new InventoryItem(
			request.productId(),
			request.sku().trim().toUpperCase(Locale.ROOT),
			request.name().trim(),
			request.quantityOnHand(),
			threshold
		);
		log.info("create inventory item productId={} sku={} qty={}",
			request.productId(), item.getSku(), request.quantityOnHand());
		return InventoryItemResponse.from(inventoryItemRepository.save(item));
	}

	@Transactional(readOnly = true)
	public InventorySummaryResponse getSummary() {
		java.util.List<InventoryItem> all = inventoryItemRepository.findAll();
		long totalItems = all.size();
		long totalOnHand = 0;
		long totalReserved = 0;
		long totalAvailable = 0;
		long outOfStock = 0;
		long lowStock = 0;

		for (InventoryItem i : all) {
			totalOnHand += i.getQuantityOnHand();
			totalReserved += i.getQuantityReserved();
			int avail = i.getAvailableQuantity();
			totalAvailable += Math.max(0, avail);
			if (avail <= 0) {
				outOfStock++;
			} else if (avail <= i.getLowStockThreshold()) {
				lowStock++;
			}
		}

		return new InventorySummaryResponse(
				totalItems,
				totalOnHand,
				totalReserved,
				totalAvailable,
				outOfStock,
				lowStock
		);
	}


	@Transactional
	public InventoryItemResponse adjustStock(UUID productId, int quantityDelta) {
		InventoryItem item = requireItem(productId);
		int newOnHand = item.getQuantityOnHand() + quantityDelta;
		if (newOnHand < item.getQuantityReserved()) {
			throw new IllegalStateException(
				"Số lượng tồn sau điều chỉnh (%d) nhỏ hơn số lượng đã giữ (%d)."
					.formatted(newOnHand, item.getQuantityReserved())
			);
		}
		item.adjustStock(quantityDelta);
		return InventoryItemResponse.from(inventoryItemRepository.save(item));
	}

	@Transactional(readOnly = true)
	public InventoryItemResponse findByProductId(UUID productId) {
		return InventoryItemResponse.from(requireItem(productId));
	}

	/**
	 * Danh sách tồn kho với filter tuỳ chọn:
	 * <ul>
	 *   <li>{@code q} — tìm theo tên hoặc SKU (không phân biệt hoa thường).</li>
	 *   <li>{@code stockStatus} — lọc theo trạng thái thực tế
	 *       (OUT_OF_STOCK: khả dụng ≤ 0; LOW_STOCK: 0 &lt; khả dụng ≤ ngưỡng;
	 *       IN_STOCK: khả dụng &gt; ngưỡng).</li>
	 * </ul>
	 */
	@Transactional(readOnly = true)
	public Page<InventoryItemResponse> findAll(String q, InventoryStatus stockStatus, Pageable pageable) {
		Specification<InventoryItem> spec = null;
		if (q != null && !q.isBlank()) {
			String like = "%" + escapeLike(q.trim().toLowerCase()) + "%";
			spec = (root, query, cb) -> cb.or(
					cb.like(cb.lower(root.get("name")), like, '\\'),
					cb.like(cb.lower(root.get("sku")), like, '\\'));
		}
		if (stockStatus != null) {
			Specification<InventoryItem> statusSpec = (root, query, cb) -> {
				Expression<Integer> available = cb.diff(root.get("quantityOnHand"), root.get("quantityReserved"));
				return switch (stockStatus) {
					case OUT_OF_STOCK -> cb.lessThanOrEqualTo(available, 0);
					case LOW_STOCK -> cb.and(
							cb.greaterThan(available, 0),
						cb.lessThanOrEqualTo(available, root.get("lowStockThreshold")));
					case IN_STOCK -> cb.greaterThan(available, root.get("lowStockThreshold"));
				};
			};
			spec = (spec == null) ? statusSpec : spec.and(statusSpec);
		}
		if (spec == null) {
			return inventoryItemRepository.findAll(pageable).map(InventoryItemResponse::from);
		}
		return inventoryItemRepository.findAll(spec, pageable).map(InventoryItemResponse::from);
	}

	@Transactional
	public InventoryItemResponse updateItemById(UUID id, UpdateInventoryItemRequest request) {
		InventoryItem item = inventoryItemRepository.findById(id)
			.orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy inventory item " + id));
		if (request.totalImported() != null) {
			int total = Math.max(0, request.totalImported());
			if (total < item.getSoldQuantity()) {
				throw new IllegalStateException(
					"Tổng nhập không thể nhỏ hơn số lượng đã bán (" + item.getSoldQuantity() + ")."
				);
			}
			item.setTotalImported(total);
			item.setQuantityOnHand(total - item.getSoldQuantity());
		} else if (request.quantityOnHand() != null) {
			int onHand = Math.max(0, request.quantityOnHand());
			item.setQuantityOnHand(onHand);
			item.setTotalImported(onHand + item.getSoldQuantity());
		}
		if (request.lowStockThreshold() != null) {
			item.setLowStockThreshold(Math.max(0, request.lowStockThreshold()));
		}
		return InventoryItemResponse.from(inventoryItemRepository.save(item));
	}

	@Transactional
	public void bulkUpdate(java.util.List<BulkUpdateItemRequest> requests) {
		for (BulkUpdateItemRequest req : requests) {
			if (req.inventoryItemId() == null) continue;
			inventoryItemRepository.findById(req.inventoryItemId()).ifPresent(item -> {
				int qty = req.quantity();
				if ("increase".equalsIgnoreCase(req.mode())) {
					item.setQuantityOnHand(item.getQuantityOnHand() + qty);
				} else if ("decrease".equalsIgnoreCase(req.mode())) {
					item.setQuantityOnHand(Math.max(0, item.getQuantityOnHand() - qty));
				} else {
					item.setQuantityOnHand(Math.max(0, qty));
				}
				inventoryItemRepository.save(item);
			});
		}
	}

	@Transactional(readOnly = true)
	public String exportCsv() {
		StringBuilder sb = new StringBuilder();
		sb.append("id,productId,sku,name,quantityOnHand,quantityReserved,lowStockThreshold,updatedAt\n");
		for (InventoryItem item : inventoryItemRepository.findAll()) {
			sb.append("%s,%s,\"%s\",\"%s\",%d,%d,%d,%s\n".formatted(
				item.getId(),
				item.getProductId(),
				item.getSku(),
				item.getName().replace("\"", "\"\""),
				item.getQuantityOnHand(),
				item.getQuantityReserved(),
				item.getLowStockThreshold(),
				item.getUpdatedAt()
			));
		}
		return sb.toString();
	}

	/** Escape ký tự wildcard LIKE (% _ \) trong từ khoá tìm kiếm. */
	private static String escapeLike(String value) {
		return value.replace("\\", "\\\\")
				.replace("%", "\\%")
				.replace("_", "\\_");
	}

	InventoryItem requireItem(UUID productId) {
		return inventoryItemRepository.findByProductId(productId)
			.orElseThrow(() -> new ResourceNotFoundException(
				"Không tìm thấy tồn kho của sản phẩm " + productId
			));
	}
}
