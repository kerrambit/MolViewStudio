import { ServerStatus } from "../server-status/ServerStatus";

import "./Footer.css";

export function Footer() {
    return (
        <footer className="footer">
            <ServerStatus></ServerStatus>
        </footer>
    );
}
