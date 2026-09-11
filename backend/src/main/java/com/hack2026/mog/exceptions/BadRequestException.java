package com.hack2026.mog.exceptions;

public class BadRequestException extends AppException {
    public BadRequestException(String message) {
        super(400, "Bad Request", message);
    }
}
