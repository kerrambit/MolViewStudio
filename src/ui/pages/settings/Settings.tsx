import { useNavigate, type NavigateFunction } from "react-router-dom";
import { IconSettingsFilled } from "@tabler/icons-react";
import Watermark from "../../components/common/watermark/Watermark";

import "./Settings.css";

export default function Settings() {
    const navigate = useNavigate();

    return (
        <div className="settings">
            <h1>Settings</h1>
            <Watermark icon={IconSettingsFilled} />
            {renderTree(navigate)}
        </div>
    );
}

function renderTreeLink(
    navigate: NavigateFunction,
    name: string,
    path: string
) {
    return (
        <li
            onClick={() => {
                navigate("/settings/" + path);
            }}
            className="settings__tree__link"
        >
            {name}
        </li>
    );
}

function renderTree(navigate: NavigateFunction) {
    return (
        <ul className="settings__tree">
            <li>
                General
                <ul>
                    {renderTreeLink(navigate, "Language", "general/language")}
                    <br></br>
                    {renderTreeLink(navigate, "UI", "general/ui")}
                    <br></br>
                    {renderTreeLink(
                        navigate,
                        "Notifications",
                        "general/notifications"
                    )}
                    <br></br>
                    {renderTreeLink(navigate, "Help", "general/help")}
                </ul>
            </li>

            {renderTreeLink(navigate, "Account", "account")}
            <br></br>
            {renderTreeLink(navigate, "Server", "server")}

            <li>
                Formats
                <ul>
                    {renderTreeLink(navigate, "Input", "formats/input")}
                    <br></br>
                    {renderTreeLink(navigate, "Export", "formats/export")}
                </ul>
            </li>

            <li>
                Processing
                <ul>
                    {renderTreeLink(navigate, "General", "processing/general")}
                    <br></br>
                    {renderTreeLink(
                        navigate,
                        "Per Format",
                        "processing/per-format"
                    )}
                </ul>
            </li>
        </ul>
    );
}
