package com.hack2026.mog.exceptions;

public class NotFoundException extends AppException {
    public NotFoundException(String message) {
        super(404, "Not Found", message);
    }
}
