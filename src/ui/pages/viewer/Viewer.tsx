import { useEffect, createRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    clearViewer,
    initMolstar,
    loadDefaultPbdStructure,
    disposeMolstar,
} from "../../../molstar-wrapper/src";

import "./Viewer.css";
import "molstar/lib/mol-plugin-ui/skin/light.scss";

export function Viewer() {
    const { t } = useTranslation();
    const parentRef = createRef<HTMLDivElement>();

    useEffect(() => {
        initMolstar(parentRef.current as HTMLDivElement, {
            showControls: false,
            isExpanded: false,
        }).then(() => {
            // const btn = parentRef.current?.querySelector(
            //     'button[title="Reset Zoom"]'
            // ) as HTMLButtonElement;
            // if (btn) btn.title = "Custom Reset";
            // const btn2 = parentRef.current?.querySelector(
            //     'button[title*="Set camera zoom to fit"]'
            // ) as HTMLButtonElement;
            // if (btn) {
            //     btn2.title = "Custom Reset Tooltip";
            //     btn2.textContent = "Custom Reset";
            // }
            // This is how to hide some of these control buttons.
            // const screenshotBtn = parentRef.current?.querySelector('button[title="Screenshot / State Snapshot"]') as HTMLButtonElement;
            // if (screenshotBtn) screenshotBtn.style.display = 'none';
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
            </nav>
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <button
                        onClick={() => {
                            clearViewer();
                        }}
                    >
                        Clear
                    </button>
                    {/* <button
                        onClick={() => {
                            loadStructureFromFile();
                        }}
                    >
                        Load structure from file...
                    </button> */}
                    <button
                        onClick={() => {
                            loadDefaultPbdStructure();
                        }}
                    >
                        Load default PBD structure
                    </button>
                </div>
                <main style={{ flex: 1, padding: "10px", minHeight: 0 }}>
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
