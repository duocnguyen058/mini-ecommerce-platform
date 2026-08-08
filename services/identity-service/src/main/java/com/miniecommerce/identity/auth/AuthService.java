package com.miniecommerce.identity.auth;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miniecommerce.identity.config.JwtService;
import com.miniecommerce.identity.user.Role;
import com.miniecommerce.identity.user.RoleName;
import com.miniecommerce.identity.user.RoleRepository;
import com.miniecommerce.identity.user.User;
import com.miniecommerce.identity.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
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
        user.addRole(userRole);
        user = userRepository.save(user);

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
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        // sub claim phải là userId UUID (cart/order/inventory parse UUID.fromString(sub))
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
