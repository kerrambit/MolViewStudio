import { useEffect, createRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/common/button/Button";
import {
    clearViewer,
    initMolstar,
    loadDefaultPbdStructure,
    disposeMolstar,
    loadStructureFromFile as molstarLoadStructureFromFile,
    getSnapshot,
} from "../../../molstar-wrapper/src";

import "./Viewer.css";
import "molstar/lib/mol-plugin-ui/skin/light.scss";
import { useMolstar } from "../../services/MolstarProvider";

export function Viewer() {
    const { t } = useTranslation();
    const parentRef = createRef<HTMLDivElement>();
    const { snapshot, setSnapshot } = useMolstar();
    const colorScheme = useComputedColorScheme();

    useEffect(() => {
        initMolstar(
            parentRef.current as HTMLDivElement,
            {
                showControls: true,
                isExpanded: false,
                darkMode: colorScheme === "dark",
            },
            snapshot
        ).then(() => {
            translateMolstarUi(parentRef);
        });

        return () => {
            const freshSnapshot = getSnapshot();
            setSnapshot(freshSnapshot);
            disposeMolstar();
        };
    }, [setSnapshot]);

    return (
        <div className="viewer">
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/viewer">{t("Viewer")}</Link> |{" "}
            </nav>
            <div style={{ display: "flex", height: "95%" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        paddingTop: "1em",
                        paddingLeft: "0.5em",
                    }}
                >
                    <Button
                        size="small"
                        onClick={() => {
                            clearViewer();
                        }}
                    >
                        {t("viewer.Clean")}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            loadStructureFromFile();
                        }}
                    >
                        {t("viewer.Load structure from file...")}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            loadDefaultPbdStructure();
                        }}
                    >
                        {t("viewer.Load default PBD structure")}
                    </Button>
                </div>
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

async function loadStructureFromFile() {
    const fileData = await window.electron.openFileExplorer();
    molstarLoadStructureFromFile(fileData);
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
