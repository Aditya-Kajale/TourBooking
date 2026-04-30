import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Centralized error handling middleware.
    Intercepts exceptions, standardizes the response format, and logs unexpected errors.
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Convert standard Django ValidationError to DRF response
    if isinstance(exc, DjangoValidationError):
        response = Response({"detail": exc.message_dict if hasattr(
            exc, 'message_dict') else list(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # Standardize 404
    if isinstance(exc, Http404):
        response = Response(
            {"detail": "The requested resource was not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # If response is None, it's an unhandled exception (e.g., 500)
    if response is None:
        logger.error("Unhandled Exception: %s", str(exc), exc_info=True)
        return Response({"error": "Internal Server Error",
                         "detail": "An unexpected error occurred. Please try again later."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Standardize structure for known errors (400, 401, 403, etc.)
    custom_data = {
        "error": "Request Failed",
        "detail": response.data.get(
            "detail",
            "An error occurred with your request."),
    }

    # If it's a validation error with field-specific messages, include them
    if isinstance(response.data, dict) and "detail" not in response.data:
        custom_data["validation_errors"] = response.data
        custom_data["detail"] = "Invalid input data provided."

    response.data = custom_data
    return response
