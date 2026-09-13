package com.hack2026.mog.dto.config;

/**
 * DTO для описания тира бустера и его стоимости во фрагментах.
 */
public record BoosterTierPricingDto(
    int tier,
    double multiplier,
    int costFragments
) {}
