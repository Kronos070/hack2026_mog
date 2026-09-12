package com.hack2026.mog.repositories;

import com.hack2026.mog.entities.GameConfigEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class GameConfigRepository implements PanacheRepositoryBase<GameConfigEntity, String> {
}
