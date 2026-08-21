package com.miniecommerce.identity.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Username không được để trống")
    @Size(min = 3, max = 50, message = "Username phải từ 3-50 ký tự")
    String username,

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, max = 100, message = "Password phải từ 6-100 ký tự")
    String password,

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    String email,

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên phải từ 2-100 ký tự")
    @jakarta.validation.constraints.Pattern(
        regexp = "^\\S+(\\s+\\S+)+$",
        message = "Vui lòng nhập đầy đủ Họ và Tên (bao gồm cả họ và tên, ít nhất 2 từ)"
    )
    String fullName,

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    String phone
) {}
