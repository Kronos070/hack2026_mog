package com.hack2026.mog.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false, unique = true, length = 128)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "bonus_balance", nullable = false)
    private Long bonusBalance = 1000L;

    @Column(name = "first_name", length = 64)
    private String firstName;

    @Column(name = "last_name", length = 64)
    private String lastName;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(nullable = false, length = 32)
    private String role = "USER";

    @Column(name = "current_house_edge", nullable = false)
    private Double currentHouseEdge = 0.04;

    @Column(name = "last_bet_amount")
    private Long lastBetAmount;

    @Column(name = "points", nullable = false)
    private Long points = 0L;

    @Column(name = "puzzle_pity", nullable = false)
    private Integer puzzlePity = 0;

    @Column(name = "fragment_balance", nullable = false)
    private Integer fragmentBalance = 6;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User() {}

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.bonusBalance = 1000L;
        this.points = 0L;
        this.fragmentBalance = 6;
        this.role = "USER";
        this.currentHouseEdge = 0.04;
    }

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (bonusBalance == null) {
            bonusBalance = 1000L;
        }
        if (points == null) {
            points = 0L;
        }
        if (fragmentBalance == null) {
            fragmentBalance = 6;
        }
        if (role == null) {
            role = "USER";
        }
        if (currentHouseEdge == null) {
            currentHouseEdge = 0.04;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Long getBonusBalance() {
        return bonusBalance;
    }

    public void setBonusBalance(Long bonusBalance) {
        this.bonusBalance = bonusBalance;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Double getCurrentHouseEdge() {
        return currentHouseEdge != null ? currentHouseEdge : 0.04;
    }

    public void setCurrentHouseEdge(Double currentHouseEdge) {
        this.currentHouseEdge = currentHouseEdge;
    }

    public Long getLastBetAmount() {
        return lastBetAmount;
    }

    public void setLastBetAmount(Long lastBetAmount) {
        this.lastBetAmount = lastBetAmount;
    }

    public Long getPoints() {
        return points != null ? points : 0L;
    }

    public void setPoints(Long points) {
        this.points = points != null ? points : 0L;
    }

    public Integer getPuzzlePity() {
        return puzzlePity != null ? puzzlePity : 0;
    }

    public void setPuzzlePity(Integer puzzlePity) {
        this.puzzlePity = puzzlePity != null ? puzzlePity : 0;
    }

    public Integer getFragmentBalance() {
        return fragmentBalance != null ? fragmentBalance : 0;
    }

    public void setFragmentBalance(Integer fragmentBalance) {
        this.fragmentBalance = fragmentBalance != null ? Math.clamp(fragmentBalance, 0, 10) : 0;
    }
}
