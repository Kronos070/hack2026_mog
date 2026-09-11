package com.hack2026.mog.exceptions;

public class ConflictException extends AppException {
    public ConflictException(String message) {
        super(409, "Conflict", message);
    }
}
