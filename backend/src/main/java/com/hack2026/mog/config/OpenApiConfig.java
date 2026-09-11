package com.hack2026.mog.config;

import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.info.Info;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;

@OpenAPIDefinition(
    info = @Info(
        title = "MOG Game Server API",
        version = "1.0.0",
        description = "REST API для бонусной crash-игры «Воздушный Шар» (Столото)"
    )
)
@SecurityScheme(
    securitySchemeName = "jwtAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT Bearer токен авторизации"
)
public class OpenApiConfig extends Application {
}
