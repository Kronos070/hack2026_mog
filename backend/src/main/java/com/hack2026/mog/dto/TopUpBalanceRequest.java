package com.hack2026.mog.dto;

public record TopUpBalanceRequest(
        Long amount
) {
    public long resolvedAmount() {
        return (amount != null && amount > 0) ? amount : 1000L;
    }
}
