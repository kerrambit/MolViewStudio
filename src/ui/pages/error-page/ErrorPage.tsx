/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { loggerUi } from "../../services/UiLoggingService";
import { Button } from "../../components/common/button/Button";
import { IconAlertHexagonFilled } from "@tabler/icons-react";

export const ErrorPage = () => {
    // Use route error hook.
    const error = useRouteError();

    // Complete the error message.
    let errorMessage = "An unknown error occurred.";
    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText || errorMessage;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    // Log error.
    loggerUi.error(
        `UI error was caught! The <ErrorPage> component will be shown. Details: <${errorMessage}>.`,
    );

    // Render the component.
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: "100vh",
            }}
        >
            {/* Warning icon. */}
            <div
                style={{
                    paddingBottom: "1.5em",
                }}
            >
                <IconAlertHexagonFilled size={"8em"} />
            </div>

            {/* Header. */}
            <h1
                style={{
                    fontSize: "2em",
                    margin: "0 0 0.5em 0",
                    fontWeight: 600,
                }}
            >
                Oops! Something went wrong...
            </h1>

            {/* Apology paragraph. */}
            <p
                style={{
                    maxWidth: "40em",
                    margin: "0 0 1.5em 0",
                }}
            >
                We apologize for the inconvenience. The application encountered
                an unexpected error and needs to be restarted.
            </p>

            {/* Error box. */}
            <div
                style={{
                    backgroundColor: "#fff5f5",
                    padding: "1rem",
                    borderRadius: "6px",
                    marginBottom: "2em",
                    maxWidth: "600px",
                    width: "100%",
                    textAlign: "left",
                    overflowX: "auto",
                }}
            >
                <code
                    style={{
                        color: "#e03131",
                        fontSize: "0.85rem",
                    }}
                >
                    {errorMessage}
                </code>
            </div>

            {/* Button to restart the app. */}
            <Button
                label="Restart the app"
                tooltip="Restarts the application."
                onClick={() => window.location.reload()}
            />
        </div>
    );
};
