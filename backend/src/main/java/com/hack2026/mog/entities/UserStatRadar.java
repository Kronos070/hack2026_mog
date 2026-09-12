package com.hack2026.mog.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "user_stat_radars", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_stat_radar", columnNames = {"user_id"})
})
public class UserStatRadar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double patience = 0.0;

    @Column(nullable = false)
    private Double boosters = 0.0;

    @Column(nullable = false)
    private Double collector = 0.0;

    @Column(nullable = false)
    private Double generosity = 0.0;

    @Column(name = "win_rate", nullable = false)
    private Double winRate = 0.0;

    @Column(nullable = false)
    private Double risk = 0.0;

    @Column(name = "games_analyzed", nullable = false)
    private Integer gamesAnalyzed = 0;

    @Column(name = "total_games", nullable = false)
    private Long totalGames = 0L;

    @Column(name = "next_recalc_in", nullable = false)
    private Integer nextRecalcIn = 10;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserStatRadar() {}

    public UserStatRadar(User user, double patience, double boosters, double collector,
                          double generosity, double winRate, double risk,
                          int gamesAnalyzed, long totalGames, int nextRecalcIn) {
        this.user = user;
        this.patience = patience;
        this.boosters = boosters;
        this.collector = collector;
        this.generosity = generosity;
        this.winRate = winRate;
        this.risk = risk;
        this.gamesAnalyzed = gamesAnalyzed;
        this.totalGames = totalGames;
        this.nextRecalcIn = nextRecalcIn;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
        if (this.patience == null) this.patience = 0.0;
        if (this.boosters == null) this.boosters = 0.0;
        if (this.collector == null) this.collector = 0.0;
        if (this.generosity == null) this.generosity = 0.0;
        if (this.winRate == null) this.winRate = 0.0;
        if (this.risk == null) this.risk = 0.0;
        if (this.gamesAnalyzed == null) this.gamesAnalyzed = 0;
        if (this.totalGames == null) this.totalGames = 0L;
        if (this.nextRecalcIn == null) this.nextRecalcIn = 10;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getPatience() {
        return patience != null ? patience : 0.0;
    }

    public void setPatience(Double patience) {
        this.patience = patience;
    }

    public Double getBoosters() {
        return boosters != null ? boosters : 0.0;
    }

    public void setBoosters(Double boosters) {
        this.boosters = boosters;
    }

    public Double getCollector() {
        return collector != null ? collector : 0.0;
    }

    public void setCollector(Double collector) {
        this.collector = collector;
    }

    public Double getGenerosity() {
        return generosity != null ? generosity : 0.0;
    }

    public void setGenerosity(Double generosity) {
        this.generosity = generosity;
    }

    public Double getWinRate() {
        return winRate != null ? winRate : 0.0;
    }

    public void setWinRate(Double winRate) {
        this.winRate = winRate;
    }

    public Double getRisk() {
        return risk != null ? risk : 0.0;
    }

    public void setRisk(Double risk) {
        this.risk = risk;
    }

    public Integer getGamesAnalyzed() {
        return gamesAnalyzed != null ? gamesAnalyzed : 0;
    }

    public void setGamesAnalyzed(Integer gamesAnalyzed) {
        this.gamesAnalyzed = gamesAnalyzed;
    }

    public Long getTotalGames() {
        return totalGames != null ? totalGames : 0L;
    }

    public void setTotalGames(Long totalGames) {
        this.totalGames = totalGames;
    }

    public Integer getNextRecalcIn() {
        return nextRecalcIn != null ? nextRecalcIn : 10;
    }

    public void setNextRecalcIn(Integer nextRecalcIn) {
        this.nextRecalcIn = nextRecalcIn;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
