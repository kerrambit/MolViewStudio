/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { router } from "../../../router/router";
import { IconSettingsFilled } from "@tabler/icons-react";
import Watermark from "../../../components/common/watermark/Watermark";

import "./SettingsTree.css";

export function SettingsTree() {
    // Render the component.
    return (
        <main
            style={{
                width: "100%",
                height: "100%",
                marginLeft: "3em",
                marginRight: "3em",
            }}
        >
            <h1>Settings</h1>
            <Watermark icon={IconSettingsFilled} />
            {renderTree()}
        </main>
    );
}

function renderTreeLink(name: string, path: string) {
    return (
        <li
            onClick={() => {
                router.navigate("/settings/" + path);
            }}
            className="settings__tree__link"
        >
            {name}
        </li>
    );
}

function renderTree() {
    return (
        <ul className="settings__tree">
            <li>
                General
                <ul>
                    {renderTreeLink("Language", "general/language")}
                    <br></br>
                    {renderTreeLink("UI", "general/ui")}
                    <br></br>
                    {renderTreeLink("Notifications", "general/notifications")}
                    <br></br>
                    {renderTreeLink("Help", "general/help")}
                </ul>
            </li>

            {renderTreeLink("Account", "account")}
            <br></br>
            {renderTreeLink("Server", "server")}

            <li>
                Formats
                <ul>
                    {renderTreeLink("Input", "formats/input")}
                    <br></br>
                    {renderTreeLink("Export", "formats/export")}
                </ul>
            </li>

            <li>
                Processing
                <ul>
                    {renderTreeLink("General", "processing/general")}
                    <br></br>
                    {renderTreeLink("Per Format", "processing/per-format")}
                </ul>
            </li>
        </ul>
    );
}
