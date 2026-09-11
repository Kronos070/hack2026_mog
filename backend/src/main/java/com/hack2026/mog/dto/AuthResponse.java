package com.hack2026.mog.dto;

public record AuthResponse(
    String token,
    String tokenType,
    long expiresIn,
    UserProfileResponse user
) {
    public static AuthResponse bearer(String token, long expiresIn, UserProfileResponse user) {
        return new AuthResponse(token, "Bearer", expiresIn, user);
    }
}
