package com.hack2026.mog.resources;

import io.smallrye.common.annotation.RunOnVirtualThread;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;

@Path("/api/ping")
public class PingResource {

    public record PingResponse(
        String status,
        Instant timestamp,
        String message
    ) {}

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RunOnVirtualThread
    public PingResponse ping() {
        return new PingResponse(
            "OK",
            Instant.now(),
            "MOG Backend is running on Java Virtual Threads"
        );
    }
}
