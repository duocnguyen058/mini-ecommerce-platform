package com.miniecommerce.identity.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miniecommerce.identity.config.JwtService;
import com.miniecommerce.identity.shared.EmailService;
import com.miniecommerce.identity.user.Role;
import com.miniecommerce.identity.user.RoleName;
import com.miniecommerce.identity.user.RoleRepository;
import com.miniecommerce.identity.user.User;
import com.miniecommerce.identity.user.UserRepository;
import com.miniecommerce.identity.user.VerificationToken;
import com.miniecommerce.identity.user.VerificationTokenRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.fullName() == null || request.fullName().trim().split("\\s+").length < 2) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ cả Họ và Tên (tối thiểu 2 từ)");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username đã tồn tại");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        Role userRole = roleRepository.findByName(RoleName.CUSTOMER)
            .orElseGet(() -> {
                Role newRole = new Role(RoleName.CUSTOMER, "Khách hàng");
                return roleRepository.save(newRole);
            });

        User user = new User(
            request.username(),
            passwordEncoder.encode(request.password()),
            request.email(),
            request.fullName()
        );
        user.setPhone(request.phone());
        user.setEnabled(false); // Bắt buộc xác thực email trước khi đăng nhập
        user.setEmailVerified(false);
        user.addRole(userRole);
        user = userRepository.save(user);

        // Tạo verification token có hiệu lực 24 giờ
        String tokenStr = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken token = new VerificationToken(user, tokenStr, expiryDate);
        verificationTokenRepository.save(token);

        // Gửi email xác thực
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), tokenStr);

        Set<String> roles = user.getRoles().stream()
            .map(role -> "ROLE_" + role.getName().name())
            .collect(Collectors.toSet());

        return AuthResponse.of(
            null,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            roles
        );
    }

    public AuthResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new IllegalArgumentException("Tên đăng nhập hoặc mật khẩu không đúng"));

        if (!user.isEmailVerified() || !user.isEnabled()) {
            throw new IllegalArgumentException("Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư email để xác thực tài khoản.");
        }

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        String token = jwtService.generateToken(authentication, user.getId());

        Set<String> roles = user.getRoles().stream()
            .map(role -> "ROLE_" + role.getName().name())
            .collect(Collectors.toSet());

        return AuthResponse.of(
            token,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            roles
        );
    }

    @Transactional
    public void verifyEmail(String tokenStr) {
        VerificationToken token = verificationTokenRepository.findByToken(tokenStr)
            .orElseThrow(() -> new IllegalArgumentException("Mã xác thực không hợp lệ hoặc không tồn tại."));

        if (token.isExpired()) {
            throw new IllegalArgumentException("Mã xác thực đã hết hạn. Vui lòng gửi lại yêu cầu xác thực.");
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        verificationTokenRepository.delete(token);
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản với email này."));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Tài khoản này đã được xác thực email trước đó.");
        }

        // Xóa token cũ nếu có
        verificationTokenRepository.findByUserId(user.getId())
            .ifPresent(verificationTokenRepository::delete);

        // Tạo token mới
        String tokenStr = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plus(24, ChronoUnit.HOURS);
        VerificationToken token = new VerificationToken(user, tokenStr, expiryDate);
        verificationTokenRepository.save(token);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), tokenStr);
    }

    public AuthResponse getCurrentUser(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        Set<String> roles = user.getRoles().stream()
            .map(role -> "ROLE_" + role.getName().name())
            .collect(Collectors.toSet());

        return AuthResponse.of(
            null,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            roles
        );
    }
}
