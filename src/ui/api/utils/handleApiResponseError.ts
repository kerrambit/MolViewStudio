import { AxiosError, isAxiosError } from "axios";
import { loggerUi } from "../../services/UiLoggingService";

/**
 * Constructs appropriate error message based on the AxiosError.
 * @param error error
 * @returns message
 */
function constructErrorMessage(error: AxiosError<any, any>) {
    if (!error.response) {
        return error.message;
    }

    const errorData = error.response.data as
        | { detail?: { error?: string } | string }
        | undefined;

    const errorMessage =
        (typeof errorData?.detail === "object"
            ? errorData.detail.error
            : errorData?.detail) || `Server returned ${error.response.status}`;

    return errorMessage;
}

/**
 * Handles logging of `error` object for given `endpoint` and `method`.
 * @param error error (expected `AxiosError` type, otherwise generic error message is logged)
 * @param endpoint used endpoint
 * @param method used method
 */
export function handleApiResponseError(
    error: unknown,
    endpoint: string,
    method: string,
) {
    if (isAxiosError(error)) {
        if (error.response) {
            // Server responded with an error.
            const errorMessage = constructErrorMessage(error);

            loggerUi.api.failureResponse(
                endpoint,
                method,
                error.response.status,
                errorMessage,
            );

            throw new Error(errorMessage);
        } else {
            // Network failure.
            loggerUi.api.networkError(
                endpoint,
                method,
                constructErrorMessage(error),
            );

            throw error;
        }
    }

    // Other problems: Zod schema validation failure, unexpected bug, ...
    loggerUi.api.unexpectedError(endpoint, method, error);

    throw error;
}
