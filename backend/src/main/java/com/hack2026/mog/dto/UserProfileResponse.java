package com.hack2026.mog.dto;

import com.hack2026.mog.entities.User;
import java.time.Instant;

public record UserProfileResponse(
    Long id,
    String username,
    String email,
    Long bonusBalance,
    String firstName,
    String lastName,
    String avatarUrl,
    String role,
    Instant createdAt,
    Instant updatedAt
) {
    public static UserProfileResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserProfileResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getBonusBalance(),
            user.getFirstName(),
            user.getLastName(),
            user.getAvatarUrl(),
            user.getRole(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
