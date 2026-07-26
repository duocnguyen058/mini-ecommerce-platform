package com.miniecommerce.identity.config;

import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtConfig jwtConfig;

    public JwtService(JwtEncoder jwtEncoder, JwtConfig jwtConfig) {
        this.jwtEncoder = jwtEncoder;
        this.jwtConfig = jwtConfig;
    }

    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtConfig.expirationMs());

        Set<String> roles = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("mini-ecommerce")
            .issuedAt(now)
            .expiresAt(expiry)
            .subject(authentication.getName())
            .claim("roles", roles)
            .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
