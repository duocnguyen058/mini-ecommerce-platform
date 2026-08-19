package com.miniecommerce.catalog.comment;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products/{productId}/comments")
public class CommentController {

    private final CommentRepository commentRepository;

    public CommentController(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @GetMapping
    public ResponseEntity<Page<Comment>> getComments(
            @PathVariable UUID productId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(commentRepository.findByProductId(productId, pageable));
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(
            @PathVariable UUID productId,
            @RequestBody Comment commentReq
    ) {
        Comment comment = new Comment(
                productId,
                commentReq.getUserId() != null ? commentReq.getUserId() : UUID.randomUUID(),
                commentReq.getUserName() != null ? commentReq.getUserName() : "Người dùng",
                commentReq.getUserAvatar(),
                commentReq.getContent(),
                commentReq.isAdmin()
        );
        return ResponseEntity.ok(commentRepository.save(comment));
    }
}
