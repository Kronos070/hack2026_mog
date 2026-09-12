package com.hack2026.mog.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_rounds")
public class GameRound {

    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_FINISHED = "FINISHED";
    public static final String STATUS_CRASHED = "CRASHED";

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 32)
    private String theme = "classic";

    @Column(name = "bet_amount", nullable = false)
    private Long betAmount;

    @Column(name = "booster_multiplier", nullable = false)
    private Integer boosterMultiplier = 1;

    @Column(name = "booster_level")
    private Integer boosterLevel;

    @Column(name = "booster_activated", nullable = false)
    private Boolean boosterActivated = false;

    @Column(name = "crash_multiplier", nullable = false)
    private Double crashMultiplier;

    @Column(name = "cashout_multiplier")
    private Double cashoutMultiplier;

    @Column(name = "win_amount", nullable = false)
    private Long winAmount = 0L;

    @Column(name = "points_earned", nullable = false)
    private Integer pointsEarned = 0;

    @Column(name = "is_win", nullable = false)
    private Boolean isWin = false;

    @Column(nullable = false, length = 32)
    private String status = STATUS_IN_PROGRESS;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "server_seed", length = 64)
    private String serverSeed;

    @Column(name = "client_seed", length = 64)
    private String clientSeed;

    @Column(name = "combined_hash", length = 64)
    private String combinedHash;

    @Column(name = "nonce")
    private Long nonce = 0L;

    @Column(name = "house_edge")
    private Double houseEdge;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public GameRound() {}

    public GameRound(UUID id, User user, String theme, Long betAmount, Integer boosterMultiplier,
                     Double crashMultiplier, Double houseEdge, String serverSeed, String clientSeed,
                     String combinedHash, Long nonce, Instant startTime) {
        this.id = id != null ? id : UUID.randomUUID();
        this.user = user;
        this.theme = theme != null ? theme : "classic";
        this.betAmount = betAmount;
        this.boosterMultiplier = boosterMultiplier != null ? boosterMultiplier : 1;
        this.crashMultiplier = crashMultiplier;
        this.houseEdge = houseEdge;
        this.serverSeed = serverSeed;
        this.clientSeed = clientSeed;
        this.combinedHash = combinedHash;
        this.nonce = nonce != null ? nonce : 0L;
        this.startTime = startTime != null ? startTime : Instant.now();
        this.status = STATUS_IN_PROGRESS;
        this.isWin = false;
        this.winAmount = 0L;
        this.pointsEarned = 0;
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (startTime == null) {
            startTime = createdAt;
        }
        if (status == null) {
            status = STATUS_IN_PROGRESS;
        }
        if (boosterMultiplier == null) {
            boosterMultiplier = 1;
        }
        if (winAmount == null) {
            winAmount = 0L;
        }
        if (pointsEarned == null) {
            pointsEarned = 0;
        }
        if (isWin == null) {
            isWin = false;
        }
        if (boosterActivated == null) {
            boosterActivated = false;
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Long getBetAmount() {
        return betAmount;
    }

    public void setBetAmount(Long betAmount) {
        this.betAmount = betAmount;
    }

    public Integer getBoosterMultiplier() {
        return boosterMultiplier;
    }

    public void setBoosterMultiplier(Integer boosterMultiplier) {
        this.boosterMultiplier = boosterMultiplier;
    }

    public Double getCrashMultiplier() {
        return crashMultiplier;
    }

    public void setCrashMultiplier(Double crashMultiplier) {
        this.crashMultiplier = crashMultiplier;
    }

    public Double getCashoutMultiplier() {
        return cashoutMultiplier;
    }

    public void setCashoutMultiplier(Double cashoutMultiplier) {
        this.cashoutMultiplier = cashoutMultiplier;
    }

    public Long getWinAmount() {
        return winAmount;
    }

    public void setWinAmount(Long winAmount) {
        this.winAmount = winAmount;
    }

    public Integer getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(Integer pointsEarned) {
        this.pointsEarned = pointsEarned;
    }

    public Boolean getIsWin() {
        return isWin;
    }

    public void setIsWin(Boolean isWin) {
        this.isWin = isWin;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public String getServerSeed() {
        return serverSeed;
    }

    public void setServerSeed(String serverSeed) {
        this.serverSeed = serverSeed;
    }

    public String getClientSeed() {
        return clientSeed;
    }

    public void setClientSeed(String clientSeed) {
        this.clientSeed = clientSeed;
    }

    public String getCombinedHash() {
        return combinedHash;
    }

    public void setCombinedHash(String combinedHash) {
        this.combinedHash = combinedHash;
    }

    public Long getNonce() {
        return nonce;
    }

    public void setNonce(Long nonce) {
        this.nonce = nonce;
    }

    public Double getHouseEdge() {
        return houseEdge;
    }

    public void setHouseEdge(Double houseEdge) {
        this.houseEdge = houseEdge;
    }

    public Integer getBoosterLevel() {
        return boosterLevel;
    }

    public void setBoosterLevel(Integer boosterLevel) {
        this.boosterLevel = boosterLevel;
    }

    public Boolean getBoosterActivated() {
        return boosterActivated != null ? boosterActivated : false;
    }

    public void setBoosterActivated(Boolean boosterActivated) {
        this.boosterActivated = boosterActivated != null ? boosterActivated : false;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
