package com.hack2026.mog.exceptions;

import com.hack2026.mog.dto.ErrorResponse;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class AppExceptionMapper implements ExceptionMapper<AppException> {

    @Override
    public Response toResponse(AppException exception) {
        ErrorResponse errorResponse = new ErrorResponse(
            exception.getStatusCode(),
            exception.getError(),
            exception.getMessage()
        );
        return Response.status(exception.getStatusCode())
            .type(MediaType.APPLICATION_JSON)
            .entity(errorResponse)
            .build();
    }
}
