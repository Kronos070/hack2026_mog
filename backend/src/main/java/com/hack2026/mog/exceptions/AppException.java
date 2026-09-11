package com.hack2026.mog.exceptions;

public class AppException extends RuntimeException {
    private final int statusCode;
    private final String error;

    public AppException(int statusCode, String error, String message) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getError() {
        return error;
    }
}
