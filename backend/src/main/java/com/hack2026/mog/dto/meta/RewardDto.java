package com.hack2026.mog.dto.meta;

/**
 * DTO награды за раунд (фрагмент пазла), в точности соответствует rewardSchema фронтенда.
 */
public record RewardDto(
        String kind,
        String pieceId,
        String label,
        int collected,
        int total
) {
    public static RewardDto puzzlePiece(String pieceId, String label, int collected, int total) {
        return new RewardDto("puzzle-piece", pieceId, label, collected, total);
    }
}
