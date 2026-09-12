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
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "tournament_history")
public class TournamentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tournament_title", nullable = false, length = 128)
    private String tournamentTitle;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false)
    private Integer place;

    @Column(nullable = false)
    private Long score;

    @Column(name = "prize_awarded", nullable = false)
    private Long prizeAwarded;

    @Column(name = "awarded_at", nullable = false)
    private Instant awardedAt;

    public TournamentHistory() {}

    public TournamentHistory(String tournamentTitle, Instant periodStart, Instant periodEnd,
                             User user, String username, Integer place, Long score, Long prizeAwarded) {
        this.tournamentTitle = tournamentTitle;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.user = user;
        this.username = username;
        this.place = place;
        this.score = score;
        this.prizeAwarded = prizeAwarded;
        this.awardedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.awardedAt == null) {
            this.awardedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTournamentTitle() {
        return tournamentTitle;
    }

    public void setTournamentTitle(String tournamentTitle) {
        this.tournamentTitle = tournamentTitle;
    }

    public Instant getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(Instant periodStart) {
        this.periodStart = periodStart;
    }

    public Instant getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(Instant periodEnd) {
        this.periodEnd = periodEnd;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getPlace() {
        return place;
    }

    public void setPlace(Integer place) {
        this.place = place;
    }

    public Long getScore() {
        return score;
    }

    public void setScore(Long score) {
        this.score = score;
    }

    public Long getPrizeAwarded() {
        return prizeAwarded;
    }

    public void setPrizeAwarded(Long prizeAwarded) {
        this.prizeAwarded = prizeAwarded;
    }

    public Instant getAwardedAt() {
        return awardedAt;
    }

    public void setAwardedAt(Instant awardedAt) {
        this.awardedAt = awardedAt;
    }
}
