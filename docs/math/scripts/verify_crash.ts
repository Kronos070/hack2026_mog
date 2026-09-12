#!/usr/bin/env ts-node
/**
 * MOG (Make Ochko Great) — Provably Fair Crash Verifier (TypeScript)
 * =================================================================
 * Автономный верификатор исхода раунда для независимой проверки игроком.
 * 
 * Использование:
 *   npx ts-node verify_crash.ts <serverSeed> <clientSeed> <nonce> <houseEdge> <expectedCrash>
 * 
 * Пример запуска:
 *   npx ts-node verify_crash.ts "a1b2c3d4e5f6..." "my_client_seed" 1726140000000 0.04 2.45
 */

import { createHmac, createHash } from "crypto";

export interface VerificationResult {
  isValid: boolean;
  calculatedCrash: number;
  rawCrash: number;
  hash52Bits: string;
  hmacSha256Hex: string;
  publicCommitment: string; // SHA256(serverSeed:clientSeed:nonce)
}

/**
 * Основная функция проверки раунда.
 *
 * @param serverSeed    Раскрытый сервером секретный сид
 * @param clientSeed    Сид клиента
 * @param nonce         Таймштамп / номер раунда
 * @param houseEdge     Значение преимущества казино (по умолчанию 0.04)
 * @param expectedCrash Ожидаемый итоговый коэффициент из ответа кэшаута
 */
export function verifyRoundCrash(
  serverSeed: string,
  clientSeed: string,
  nonce: number | string,
  houseEdge: number = 0.04,
  expectedCrash?: number
): VerificationResult {
  const combinedSeed = `${clientSeed}:${nonce}`;

  // 1. Вычисляем публичный хэш-коммитмент раунда (отдается клиенту до старта)
  const publicCommitment = createHash("sha256")
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest("hex");

  // 2. Вычисляем HMAC-SHA256 от combinedSeed по секретному ключу serverSeed
  const hmac = createHmac("sha256", Buffer.from(serverSeed, "utf-8"))
    .update(Buffer.from(combinedSeed, "utf-8"))
    .digest();

  const hmacSha256Hex = hmac.toString("hex");

  // 3. Извлекаем первые 52 бита (6 полных байт + 4 старших бита 7-го байта)
  let h = 0n;
  for (let i = 0; i < 6; i++) {
    h = (h << 8n) | BigInt(hmac[i]);
  }
  h = (h << 4n) | BigInt(hmac[6] >> 4);

  const e = 1n << 52n; // 2^52 = 4,503,599,627,370,496
  const eNum = Number(e);
  const hNum = Number(h);

  // 4. Расчет коэффициента краха по модели Столото MOG:
  // crash = max( 1.00, ((100 * e - h) / (e - h)) * (1 - HE) / 100 )
  const numerator = 100.0 * eNum - hNum;
  const denominator = eNum - hNum;
  const rawCrash = (numerator / denominator) * (1.0 - houseEdge) / 100.0;

  // 5. Округление вниз до 2 десятичных знаков (стандарт crash-игр)
  const calculatedCrash = Math.max(1.00, Math.floor(rawCrash * 100.0) / 100.0);

  const isValid = expectedCrash !== undefined 
    ? Math.abs(calculatedCrash - expectedCrash) < 1e-4
    : true;

  return {
    isValid,
    calculatedCrash,
    rawCrash,
    hash52Bits: h.toString(16),
    hmacSha256Hex,
    publicCommitment
  };
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("=================================================================");
    console.log("MOG Provably Fair Crash Verifier — Тестовый прогон эталонного раунда");
    console.log("=================================================================");

    const sampleServerSeed = "e4f809228962634d0b1a6c0b3c66289b4f6b0f0b4d45c4d092928574c82b0a32";
    const sampleClientSeed = "test_client_seed";
    const sampleNonce = 1726140000000;
    const sampleHouseEdge = 0.04;

    const result = verifyRoundCrash(sampleServerSeed, sampleClientSeed, sampleNonce, sampleHouseEdge);

    console.log(`Server Seed:        ${sampleServerSeed}`);
    console.log(`Client Seed:        ${sampleClientSeed}`);
    console.log(`Nonce:              ${sampleNonce}`);
    console.log(`House Edge:         ${(sampleHouseEdge * 100).toFixed(2)}%`);
    console.log(`HMAC-SHA256:        ${result.hmacSha256Hex}`);
    console.log(`Первые 52 бита (h): 0x${result.hash52Bits}`);
    console.log(`Точный множитель:   ${result.rawCrash.toFixed(6)}x`);
    console.log(`Итоговый краш:      ${result.calculatedCrash.toFixed(2)}x`);
    console.log(`Pre-commitment SHA: ${result.publicCommitment}`);
    console.log("=================================================================");
    console.log("Для проверки своего раунда передайте параметры:");
    console.log("  npx ts-node verify_crash.ts <serverSeed> <clientSeed> <nonce> <houseEdge> <expectedCrash>");
  } else if (args.length >= 4) {
    const serverSeed = args[0];
    const clientSeed = args[1];
    const nonce = args[2];
    const houseEdge = parseFloat(args[3]);
    const expectedCrash = args[4] ? parseFloat(args[4]) : undefined;

    const res = verifyRoundCrash(serverSeed, clientSeed, nonce, houseEdge, expectedCrash);
    console.log("\nРезультат верификации:");
    console.log(`  Расчетный коэффициент: ${res.calculatedCrash.toFixed(2)}x (точное: ${res.rawCrash.toFixed(4)}x)`);
    console.log(`  HMAC хэш:              ${res.hmacSha256Hex}`);
    if (expectedCrash !== undefined) {
      console.log(`  Ожидаемый коэффициент: ${expectedCrash.toFixed(2)}x`);
      console.log(`  Статус честности:       ${res.isValid ? "✅ ЧЕСТНОСТЬ ПОДТВЕРЖДЕНА" : "❌ ОШИБКА СОВПАДЕНИЯ"}`);
    }
  } else {
    console.error("Неверные аргументы. Требуется: <serverSeed> <clientSeed> <nonce> <houseEdge> [expectedCrash]");
    process.exit(1);
  }
}
