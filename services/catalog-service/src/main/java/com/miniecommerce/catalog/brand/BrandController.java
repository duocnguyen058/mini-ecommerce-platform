package com.miniecommerce.catalog.brand;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.miniecommerce.catalog.product.ProductRepository;
import com.miniecommerce.catalog.product.ProductResponse;
import com.miniecommerce.catalog.product.ProductService;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public BrandController(BrandRepository brandRepository,
                           ProductRepository productRepository,
                           ProductService productService) {
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands() {
        List<BrandResponse> list = brandRepository.findAll().stream()
                .map(b -> BrandResponse.from(b, productRepository.countByBrandId(b.getId())))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandResponse> getBrandById(@PathVariable UUID id) {
        return brandRepository.findById(id)
                .map(b -> ResponseEntity.ok(BrandResponse.from(b, productRepository.countByBrandId(b.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<BrandResponse> getBrandBySlug(@PathVariable String slug) {
        return brandRepository.findBySlug(slug)
                .map(b -> ResponseEntity.ok(BrandResponse.from(b, productRepository.countByBrandId(b.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/products")
    public Page<ProductResponse> getProductsByBrand(
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable) {
        return productService.searchAdvanced(null, null, id, null, null, null, pageable);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BrandResponse> createBrand(@RequestBody Brand brandReq) {
        Brand newBrand = new Brand(
                brandReq.getName(),
                brandReq.getSlug(),
                brandReq.getLogoUrl(),
                brandReq.getDescription(),
                brandReq.getCountry()
        );
        Brand saved = brandRepository.save(newBrand);
        return ResponseEntity.ok(BrandResponse.from(saved, 0));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BrandResponse> updateBrand(@PathVariable UUID id, @RequestBody Brand brandReq) {
        return brandRepository.findById(id).map(brand -> {
            if (brandReq.getName() != null && !brandReq.getName().isBlank()) {
                brand.setName(brandReq.getName().trim());
            }
            if (brandReq.getSlug() != null && !brandReq.getSlug().isBlank()) {
                brand.setSlug(brandReq.getSlug().trim());
            }
            brand.setLogoUrl(brandReq.getLogoUrl());
            brand.setDescription(brandReq.getDescription());
            brand.setCountry(brandReq.getCountry());
            brand.setUpdatedAt(Instant.now());
            Brand saved = brandRepository.save(brand);
            return ResponseEntity.ok(BrandResponse.from(saved, productRepository.countByBrandId(saved.getId())));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBrand(@PathVariable UUID id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thương hiệu"));

        long productCount = productRepository.countByBrandId(id);
        if (productCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể xóa thương hiệu '" + brand.getName() + "' vì vẫn còn " + productCount + " sản phẩm đang liên kết."
            );
        }

        brandRepository.delete(brand);
        return ResponseEntity.noContent().build();
    }
}
