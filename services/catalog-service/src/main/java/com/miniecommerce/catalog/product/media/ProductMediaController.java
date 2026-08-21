package com.miniecommerce.catalog.product.media;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.miniecommerce.catalog.shared.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1/products/{productId}/media")
public class ProductMediaController {

    private final ProductMediaRepository mediaRepository;

    public ProductMediaController(ProductMediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductMedia>> getMedia(@PathVariable UUID productId) {
        return ResponseEntity.ok(mediaRepository.findByProductIdOrderBySortOrderAsc(productId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductMedia> addMedia(
            @PathVariable UUID productId,
            @RequestBody ProductMedia req
    ) {
        ProductMedia media = new ProductMedia(
                productId,
                req.getVariantId(),
                req.getMediaType() != null ? req.getMediaType() : "IMAGE",
                req.getMediaUrl(),
                req.getThumbnailUrl(),
                req.getAltText(),
                req.getSortOrder()
        );
        return ResponseEntity.ok(mediaRepository.save(media));
    }

    @DeleteMapping("/{mediaId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMedia(
            @PathVariable UUID productId,
            @PathVariable UUID mediaId
    ) {
        ProductMedia media = mediaRepository.findByIdAndProductId(mediaId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy media của sản phẩm"));
        mediaRepository.delete(media);
        return ResponseEntity.noContent().build();
    }
}
