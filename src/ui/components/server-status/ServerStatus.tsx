import { useServerStatus } from "../../hooks/useServerStatus";

import "./ServerStatus.css";

export function ServerStatus() {
    const { isLoading, error } = useServerStatus();

    if (isLoading) {
        return (
            <div className="serverStatus">
                Server status:{" "}
                <span title="Connecting..." className="dot dot--yellow"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="serverStatus">
                Server status:{" "}
                <span
                    title={`Server has ended with an error: <${error.message}>! Go to Settings for more information.`}
                    className="dot dot--red"
                ></span>
            </div>
        );
    }

    return (
        <div className="serverStatus">
            Server status:{" "}
            <span title="Server is running." className="dot dot--green"></span>
        </div>
    );
}
