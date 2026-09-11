package com.hack2026.mog.services;

import com.hack2026.mog.dto.ChangePasswordRequest;
import com.hack2026.mog.dto.PageResponse;
import com.hack2026.mog.dto.UpdateProfileRequest;
import com.hack2026.mog.dto.UserProfileResponse;
import com.hack2026.mog.entities.User;
import com.hack2026.mog.exceptions.BadRequestException;
import com.hack2026.mog.exceptions.ConflictException;
import com.hack2026.mog.exceptions.NotFoundException;
import com.hack2026.mog.repositories.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class UserService {

    @Inject
    UserRepository userRepository;

    public UserProfileResponse getProfile(Long id) {
        User user = userRepository.findByIdOptional(id)
            .orElseThrow(() -> new NotFoundException("Пользователь с id " + id + " не найден"));
        return UserProfileResponse.fromEntity(user);
    }

    public PageResponse<UserProfileResponse> listUsers(int page, int size) {
        if (page < 0) {
            page = 0;
        }
        if (size <= 0 || size > 100) {
            size = 20;
        }

        long totalElements = userRepository.count();
        int totalPages = (int) Math.ceil((double) totalElements / size);

        List<UserProfileResponse> items = userRepository.findAll(Sort.by("id"))
            .page(Page.of(page, size))
            .list()
            .stream()
            .map(UserProfileResponse::fromEntity)
            .toList();

        return new PageResponse<>(items, page, size, totalElements, totalPages);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long id, UpdateProfileRequest req) {
        User user = userRepository.findByIdOptional(id)
            .orElseThrow(() -> new NotFoundException("Пользователь с id " + id + " не найден"));

        if (req.username() != null && !req.username().isBlank()) {
            String newUsername = req.username().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new ConflictException("Пользователь с именем '" + newUsername + "' уже существует");
                }
                user.setUsername(newUsername);
            }
        }

        if (req.email() != null && !req.email().isBlank()) {
            String newEmail = req.email().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new ConflictException("Пользователь с email '" + newEmail + "' уже существует");
                }
                user.setEmail(newEmail);
            }
        }

        if (req.firstName() != null) {
            user.setFirstName(req.firstName().trim().isEmpty() ? null : req.firstName().trim());
        }

        if (req.lastName() != null) {
            user.setLastName(req.lastName().trim().isEmpty() ? null : req.lastName().trim());
        }

        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl().trim().isEmpty() ? null : req.avatarUrl().trim());
        }

        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest req) {
        User user = userRepository.findByIdOptional(id)
            .orElseThrow(() -> new NotFoundException("Пользователь с id " + id + " не найден"));

        if (!BcryptUtil.matches(req.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Неверный текущий пароль");
        }

        if (req.oldPassword().equals(req.newPassword())) {
            throw new BadRequestException("Новый пароль не должен совпадать с текущим");
        }

        user.setPasswordHash(BcryptUtil.bcryptHash(req.newPassword()));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findByIdOptional(id)
            .orElseThrow(() -> new NotFoundException("Пользователь с id " + id + " не найден"));
        userRepository.delete(user);
    }

    @Transactional
    public com.hack2026.mog.dto.TopUpBalanceResponse topUpBalance(Long id, Long amount) {
        User user = userRepository.findByIdOptional(id)
            .orElseThrow(() -> new NotFoundException("Пользователь с id " + id + " не найден"));

        long add = (amount != null && amount > 0) ? amount : 1000L;
        long current = user.getBonusBalance() != null ? user.getBonusBalance() : 0L;
        user.setBonusBalance(current + add);

        return new com.hack2026.mog.dto.TopUpBalanceResponse(user.getId(), user.getUsername(), add, user.getBonusBalance());
    }
}
