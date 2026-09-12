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
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "user_puzzle_pieces", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_puzzle_piece", columnNames = {"user_id", "piece_id"})
})
public class UserPuzzlePiece {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "piece_id", nullable = false, length = 32)
    private String pieceId;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    public UserPuzzlePiece() {}

    public UserPuzzlePiece(User user, String pieceId) {
        this.user = user;
        this.pieceId = pieceId;
        this.collectedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.collectedAt == null) {
            this.collectedAt = Instant.now();
        }
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

    public String getPieceId() {
        return pieceId;
    }

    public void setPieceId(String pieceId) {
        this.pieceId = pieceId;
    }

    public Instant getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(Instant collectedAt) {
        this.collectedAt = collectedAt;
    }
}
