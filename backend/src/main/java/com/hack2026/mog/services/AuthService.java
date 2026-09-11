package com.hack2026.mog.services;

import com.hack2026.mog.dto.AuthResponse;
import com.hack2026.mog.dto.LoginRequest;
import com.hack2026.mog.dto.RegisterRequest;
import com.hack2026.mog.dto.UserProfileResponse;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.exceptions.ConflictException;
import com.hack2026.mog.exceptions.UnauthorizedException;
import com.hack2026.mog.repositories.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthService {

    @Inject
    UserRepository userRepository;

    @Inject
    TokenService tokenService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String username = req.username().trim();
        String email = req.email().trim().toLowerCase();

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Пользователь с именем '" + username + "' уже существует");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Пользователь с email '" + email + "' уже существует");
        }

        String passwordHash = BcryptUtil.bcryptHash(req.password());

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setBonusBalance(1000L);
        user.setRole("USER");

        if (req.firstName() != null && !req.firstName().isBlank()) {
            user.setFirstName(req.firstName().trim());
        }
        if (req.lastName() != null && !req.lastName().isBlank()) {
            user.setLastName(req.lastName().trim());
        }
        if (req.avatarUrl() != null && !req.avatarUrl().isBlank()) {
            user.setAvatarUrl(req.avatarUrl().trim());
        }

        userRepository.persist(user);

        String token = tokenService.generateToken(user);
        return AuthResponse.bearer(
            token,
            tokenService.getExpiresInSeconds(),
            UserProfileResponse.fromEntity(user)
        );
    }

    public AuthResponse login(LoginRequest req) {
        String login = req.login().trim();
        User user = userRepository.findByUsernameOrEmail(login)
            .orElseThrow(() -> new UnauthorizedException("Неверный логин или пароль"));

        if (!BcryptUtil.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Неверный логин или пароль");
        }

        String token = tokenService.generateToken(user);
        return AuthResponse.bearer(
            token,
            tokenService.getExpiresInSeconds(),
            UserProfileResponse.fromEntity(user)
        );
    }

    public UserProfileResponse getCurrentUser(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Требуется авторизация");
        }
        User user = userRepository.findByIdOptional(userId)
            .orElseThrow(() -> new UnauthorizedException("Пользователь не найден"));

        return UserProfileResponse.fromEntity(user);
    }
}
