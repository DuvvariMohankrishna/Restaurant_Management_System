import logging

from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):

    response = exception_handler(exc, context)

    if response is None:
        return response

    if response.status_code == 400:
        message = "Validation failed."

    elif response.status_code == 401:
        message = "Authentication failed."

    elif response.status_code == 403:
        message = (
            "You do not have permission "
            "to perform this action."
        )

    elif response.status_code == 404:
        message = "Resource not found."

    else:
        message = "An error occurred."

    response.data = {
        "success": False,
        "message": message,
        "errors": response.data,
    }

    return response