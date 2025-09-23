import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dropzone, type FileWithPath } from "@mantine/dropzone";
import { IconDragDrop, IconUpload, IconX } from "@tabler/icons-react";

import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import { Button } from "../components/common/button/Button";

export default function Home() {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
            }}
        >
            <nav>
                <Link to="/">{t("Home")}</Link> |{" "}
                <Link to="/settings">{t("Settings")}</Link> |{" "}
                <Link to="/viewer">{t("Viewer")}</Link> |{" "}
                <Link to="/sidebar">{t("Sidebar page")}</Link> |{" "}
            </nav>
            <Dropzone
                style={{
                    display: "flex",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                }}
                onDrop={(files: FileWithPath[]) =>
                    console.log("TMP: accepted files: ", files)
                }
                onReject={(files) =>
                    console.log("TMP: rejected files: ", files)
                }
                activateOnClick={false}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        height: "100%",
                        gap: "5em",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1em",
                        }}
                    >
                        <div style={{ pointerEvents: "auto" }}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    window.electron.openFileExplorer();
                                }}
                            >
                                Open file in viewer...
                            </Button>
                        </div>
                        <div style={{ pointerEvents: "auto" }}>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    window.electron.openFileExplorer();
                                }}
                            >
                                Process file...
                            </Button>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Dropzone.Accept>
                            <IconUpload
                                size={160}
                                color="var(--mantine-color-blue-6)"
                                stroke={1.5}
                            />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX
                                size={160}
                                color="var(--mantine-color-red-6)"
                                stroke={1.5}
                            />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconDragDrop
                                size={160}
                                color="var(--mantine-color-dimmed)"
                                stroke={1.5}
                            />
                        </Dropzone.Idle>
                    </div>
                </div>
            </Dropzone>
        </div>
    );
}
