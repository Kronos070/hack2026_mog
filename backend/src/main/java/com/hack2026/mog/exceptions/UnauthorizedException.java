package com.hack2026.mog.exceptions;

public class UnauthorizedException extends AppException {
    public UnauthorizedException(String message) {
        super(401, "Unauthorized", message);
    }
}
