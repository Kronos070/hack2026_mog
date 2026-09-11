package com.hack2026.mog.math;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Objects;

/**
 * Генератор коэффициента краха (Crash Generator) на основе Provably Fair алгоритма HMAC-SHA256.
 * <p>
 * Реализует математическую модель:
 * <pre>
 * h = first_52_bits( HMAC_SHA256( server_seed, combined_seed ) )
 * e = 2^52
 * crash(n) = max( 1.00,  ((100·e − h) / (e − h)) · (1 − HE(n)) / 100 )
 *
 * P( crash ≥ k ) = (1 − HE(n)) / k
 * EV(n)          = −HE(n)
 * </pre>
 */
public class CrashGenerator {

    /**
     * Константа e = 2^52 = 4,503,599,627,370,496.
     * Максимальное значение для 52-битного случайного пространства.
     */
    public static final long E_52_BITS = 1L << 52;

    /**
     * Константа e в формате double для операций с плавающей точкой.
     */
    public static final double E_DOUBLE = (double) E_52_BITS;

    /**
     * Минимально возможный множитель краха в игре (1.00x).
     */
    public static final double MIN_CRASH = 1.00;

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final HexFormat HEX_FORMAT = HexFormat.of();

    /**
     * Генерация краха по serverSeed, combinedSeed и текущему значению House Edge HE(n).
     *
     * @param serverSeed   Секретный сид сервера
     * @param combinedSeed Объединенный сид раунда (например, clientSeed:nonce или publicSeed)
     * @param houseEdge    Текущее значение House Edge HE(n) (например, 0.04)
     * @return Объект {@link CrashResult} с рассчитанным множителем и криптографическими данными
     */
    public CrashResult generateCrash(String serverSeed, String combinedSeed, double houseEdge) {
        Objects.requireNonNull(serverSeed, "serverSeed must not be null");
        Objects.requireNonNull(combinedSeed, "combinedSeed must not be null");

        byte[] serverSeedBytes = serverSeed.getBytes(StandardCharsets.UTF_8);
        byte[] combinedSeedBytes = combinedSeed.getBytes(StandardCharsets.UTF_8);

        return generateCrash(serverSeedBytes, combinedSeedBytes, houseEdge, serverSeed, combinedSeed);
    }

    /**
     * Удобная перегрузка для генерации краха с разделением clientSeed и nonce.
     * combinedSeed формируется как "{clientSeed}:{nonce}".
     *
     * @param serverSeed Секретный сид сервера
     * @param clientSeed Сид клиента / раунда
     * @param nonce      Порядковый номер раунда
     * @param houseEdge  Текущее значение House Edge HE(n)
     * @return Объект {@link CrashResult}
     */
    public CrashResult generateCrash(String serverSeed, String clientSeed, long nonce, double houseEdge) {
        String combinedSeed = clientSeed + ":" + nonce;
        return generateCrash(serverSeed, combinedSeed, houseEdge);
    }

    /**
     * Генерация краха из сырых байтов.
     */
    public CrashResult generateCrash(byte[] serverSeedBytes,
                                     byte[] combinedSeedBytes,
                                     double houseEdge,
                                     String serverSeedStr,
                                     String combinedSeedStr) {
        byte[] hmac = computeHmacSha256(serverSeedBytes, combinedSeedBytes);
        String hashHex = HEX_FORMAT.formatHex(hmac);
        long h = extractFirst52Bits(hmac);

        double rawMultiplier = calculateRawCrash(h, houseEdge);
        double flooredMultiplier = floorTo2Decimals(rawMultiplier);

        return new CrashResult(
                flooredMultiplier,
                rawMultiplier,
                h,
                hashHex,
                houseEdge,
                serverSeedStr != null ? serverSeedStr : HEX_FORMAT.formatHex(serverSeedBytes),
                combinedSeedStr != null ? combinedSeedStr : HEX_FORMAT.formatHex(combinedSeedBytes)
        );
    }

    /**
     * Вычисление точного (неокругленного) множителя краха по формуле:
     * crash(n) = max( 1.00, ((100·e − h) / (e − h)) · (1 − HE(n)) / 100 ).
     *
     * @param h         Первые 52 бита HMAC хэша (0 <= h < 2^52)
     * @param houseEdge Текущее значение House Edge HE(n)
     * @return Множитель краха >= 1.00
     */
    public double calculateRawCrash(long h, double houseEdge) {
        if (h < 0 || h >= E_52_BITS) {
            throw new IllegalArgumentException("h must be in range [0, 2^52 - 1]: " + h);
        }

        double hDouble = (double) h;
        double numerator = 100.0 * E_DOUBLE - hDouble;
        double denominator = E_DOUBLE - hDouble;

        double factor = (numerator / denominator) * (1.0 - houseEdge) / 100.0;
        return Math.max(MIN_CRASH, factor);
    }

    /**
     * Извлечение первых 52 бит хэша в 64-битный long.
     * <p>
     * Берем первые 6 байт (48 бит) и 4 старших бита 7-го байта: 48 + 4 = 52 бита.
     * Соответствует первым 13 символам шестнадцатеричного представления хэша.
     *
     * @param hash Массив байт (не менее 7 байт)
     * @return 52-битное беззнаковое число в диапазоне [0, 2^52 - 1]
     */
    public static long extractFirst52Bits(byte[] hash) {
        if (hash == null || hash.length < 7) {
            throw new IllegalArgumentException("Hash must contain at least 7 bytes");
        }

        long h = 0L;
        for (int i = 0; i < 6; i++) {
            h = (h << 8) | (hash[i] & 0xFFL);
        }
        // 4 старших бита 7-го байта (индекс 6)
        h = (h << 4) | ((hash[6] & 0xFFL) >>> 4);
        return h;
    }

    /**
     * Вычисление HMAC-SHA256.
     */
    public static byte[] computeHmacSha256(byte[] key, byte[] message) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKey = new SecretKeySpec(key, HMAC_SHA256);
            mac.init(secretKey);
            return mac.doFinal(message);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to compute HMAC-SHA256", e);
        }
    }

    /**
     * Округление коэффициента вниз до 2 десятичных знаков (стандарт отображения в crash-играх).
     * Например, 1.459 -> 1.45, 2.001 -> 2.00.
     */
    public static double floorTo2Decimals(double value) {
        return Math.max(MIN_CRASH, Math.floor(value * 100.0) / 100.0);
    }

    /**
     * Проверка (Provably Fair Verification) корректности сгенерированного множителя краха.
     *
     * @param serverSeed         Сид сервера
     * @param combinedSeed       Объединенный сид
     * @param houseEdge          Использованный House Edge
     * @param expectedMultiplier Ожидаемый итоговый множитель (2 знака)
     * @return true, если расчет совпадает с ожидаемым значением
     */
    public boolean verifyCrash(String serverSeed, String combinedSeed, double houseEdge, double expectedMultiplier) {
        CrashResult result = generateCrash(serverSeed, combinedSeed, houseEdge);
        return Math.abs(result.multiplier() - expectedMultiplier) < 1e-9;
    }

    /**
     * Генерация криптографически стойкого случайного 256-битного шестнадцатеричного сида (64 hex-символа).
     */
    public static String generateSecureSeed() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HEX_FORMAT.formatHex(bytes);
    }

    /**
     * Расчет вероятности того, что крах произойдет на множителе >= k:
     * P( crash >= k ) = (1 - HE(n)) / k.
     */
    public double probabilityOfCrashAtLeast(double k, double houseEdge) {
        if (k < 1.0) {
            throw new IllegalArgumentException("k must be >= 1.0: " + k);
        }
        double p = (1.0 - houseEdge) / k;
        return Math.clamp(p, 0.0, 1.0);
    }

    /**
     * Расчет математического ожидания раунда: EV(n) = −HE(n).
     */
    public double expectedValue(double houseEdge) {
        return -houseEdge;
    }

    /**
     * Расчет теоретического возврата игроку: RTP(n) = 1 − HE(n).
     */
    public double returnToPlayer(double houseEdge) {
        return 1.0 - houseEdge;
    }
}
