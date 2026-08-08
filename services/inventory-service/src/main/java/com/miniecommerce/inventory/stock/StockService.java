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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
		item.setQuantityOnHand(newOnHand);
		return InventoryItemResponse.from(inventoryItemRepository.save(item));
	}

	@Transactional(readOnly = true)
	public InventoryItemResponse findByProductId(UUID productId) {
		return InventoryItemResponse.from(requireItem(productId));
	}

	@Transactional(readOnly = true)
	public Page<InventoryItemResponse> findAll(Pageable pageable) {
		return inventoryItemRepository.findAll(pageable).map(InventoryItemResponse::from);
	}

	InventoryItem requireItem(UUID productId) {
		return inventoryItemRepository.findByProductId(productId)
			.orElseThrow(() -> new ResourceNotFoundException(
				"Không tìm thấy tồn kho của sản phẩm " + productId
			));
	}
}
