package com.hack2026.mog.math;

/**
 * Результат детерминированной генерации краха для раунда.
 *
 * @param multiplier     Итоговый множитель краха, округленный вниз до 2 знаков (стандарт crash-игр), min 1.00
 * @param rawMultiplier  Точное значение множителя краха с плавающей точкой (без округления)
 * @param hashBits       Число h, полученное из первых 52 бит HMAC-SHA256 (0 <= h < 2^52)
 * @param hashHex        Полный 64-символьный hex-хэш HMAC-SHA256
 * @param houseEdge      Значение House Edge HE(n), использованное при генерации
 * @param serverSeed     Использованный server seed
 * @param combinedSeed   Использованный combined seed (или clientSeed:nonce)
 */
public record CrashResult(
        double multiplier,
        double rawMultiplier,
        long hashBits,
        String hashHex,
        double houseEdge,
        String serverSeed,
        String combinedSeed
) {
    public CrashResult {
        if (multiplier < 1.00) {
            throw new IllegalArgumentException("multiplier cannot be less than 1.00: " + multiplier);
        }
    }
}
