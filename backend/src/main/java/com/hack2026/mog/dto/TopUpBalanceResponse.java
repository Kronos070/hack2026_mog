package com.hack2026.mog.dto;

public record TopUpBalanceResponse(
        Long userId,
        String username,
        Long addedAmount,
        Long newBalance
) {}
