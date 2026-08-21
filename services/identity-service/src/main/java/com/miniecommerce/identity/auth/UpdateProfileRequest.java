package com.miniecommerce.identity.auth;

public record UpdateProfileRequest(
    String fullName,
    String phone,
    Boolean enabled
) {}
