import { useEffect, createRef, type RefObject, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    clearViewer,
    initMolstar,
    disposeMolstar,
} from "../../molstar-wrapper/src";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { LoadingOverlay, useComputedColorScheme } from "@mantine/core";
import {
    useMenu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../services/MenuProvider";
import type { TFunction } from "i18next";
import { Sidebar } from "../components/common/sidebar/Sidebar";
import { Button } from "../components/common/button/Button";

import "./SidebarPage.css";

export function SidebarPage() {
    const { t } = useTranslation();
    const colorScheme = useComputedColorScheme();
    const { deleteRootMenuItem, addRootMenuItem } = useMenu();
    const [molstarLoading, setMolstarLoading] = useState(true);

    const edit = createEditRootMenuItem(t);
    useEffect(() => {
        addRootMenuItem(edit);
        return () => {
            deleteRootMenuItem(edit.id);
        };
    }, []);

    const parentRef = createRef<HTMLDivElement>();

    useEffect(() => {
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: true,
                isExpanded: false,
                darkMode: colorScheme === "dark",
            },
            null
        ).then(() => {
            translateMolstarUi(parentRef);
            setMolstarLoading(false);
        });

        return () => {
            disposeMolstar();
        };
    }, []);

    return (
        <div className="viewer">
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/viewer">{t("Viewer")}</Link> |{" "}
                <Link to="/sidebar">{t("Sidebar page")}</Link> |{" "}
            </nav>
            <div className="viewer-content">
                <LoadingOverlay
                    visible={molstarLoading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{ type: "oval" }}
                />
                <Sidebar style={{ gap: ".25em" }}>
                    {Array.from({ length: 40 }, (_, index) => {
                        return (
                            <Button
                                key={index.toString()}
                                label={`Button ${index + 1 < 10 ? "0" : ""}${
                                    index + 1
                                }`}
                            ></Button>
                        );
                    })}
                </Sidebar>
                <Sidebar style={{ gap: ".25em" }}>
                    {Array.from({ length: 40 }, (_, index) => {
                        return (
                            <Button
                                key={index.toString()}
                                label={`Button ${index + 1 < 10 ? "0" : ""}${
                                    index + 1
                                }`}
                            ></Button>
                        );
                    })}
                </Sidebar>
                <main style={{ flex: 1, padding: "1em", minHeight: 0 }}>
                    <div
                        ref={parentRef}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </main>
            </div>
        </div>
    );
}

async function translateMolstarUi(parent: RefObject<HTMLDivElement | null>) {
    const btn = parent.current?.querySelector(
        'button[title="Reset Zoom"]'
    ) as HTMLButtonElement;
    if (btn) btn.title = "Custom Reset";
    const btn2 = parent.current?.querySelector(
        'button[title*="Set camera zoom to fit"]'
    ) as HTMLButtonElement;
    if (btn) {
        btn2.title = "Custom Reset Tooltip";
        btn2.textContent = "Custom Reset";
    }

    const screenshotBtn = parent.current?.querySelector(
        'button[title="Screenshot / State Snapshot"]'
    ) as HTMLButtonElement;
    if (screenshotBtn) screenshotBtn.style.display = "none";

    const toggleControlsBtn = parent.current?.querySelector(
        'button[title="Toggle Controls Panel"]'
    ) as HTMLButtonElement;
    if (toggleControlsBtn) toggleControlsBtn.style.display = "none";
}

function createEditRootMenuItem(t: TFunction<"translation", undefined>) {
    // TODO: use this icon: https://fontawesome.com/icons/broom?f=classic&s=solid.
    const clearViewerItem: MenuItem = {
        id: crypto.randomUUID(),
        title: t("menu.pageSpecific.viewer.Clear viewer"),
        task: {
            action: () => {
                clearViewer();
            },
            type: "direct",
        },
    };
    const section: Section = {
        id: crypto.randomUUID(),
        items: [clearViewerItem],
    };
    const edit: RootMenuItem = {
        id: crypto.randomUUID(),
        title: "Edit",
        task: [section],
        priority: 3,
    };

    return edit;
}
