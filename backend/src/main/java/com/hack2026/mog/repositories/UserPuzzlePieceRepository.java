package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.UserPuzzlePiece;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UserPuzzlePieceRepository implements PanacheRepository<UserPuzzlePiece> {

    public List<UserPuzzlePiece> findByUserId(Long userId) {
        return list("user.id = ?1 order by id asc", userId);
    }

    public List<String> findPieceIdsByUserId(Long userId) {
        return find("select p.pieceId from UserPuzzlePiece p where p.user.id = ?1 order by p.id asc", userId)
                .project(String.class)
                .list();
    }

    public Optional<UserPuzzlePiece> findByUserAndPieceId(Long userId, String pieceId) {
        return find("user.id = ?1 and pieceId = ?2", userId, pieceId).firstResultOptional();
    }

    public long countByUserId(Long userId) {
        return count("user.id", userId);
    }
}
