import { useState, useCallback } from "react";
import { Button } from "../../../components/common/button/Button";
import { Badge } from "@mantine/core";
import { useEnvironment } from "../../../hooks/useEnvironment";
import desktopIcon from "../../../../assets/desktopIcon.png";
import { useAppearance } from "../../../hooks/useAppearance";

interface AboutDialogueContentProps {
    close: () => void;
}

interface Row {
    label: string;
    value: string;
}

function InfoRow({ label, value }: Row) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
            }}
        >
            <span style={{ fontSize: 14 }}>{label}</span>
            <span
                style={{
                    fontSize: 12,
                    textAlign: "right",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {value}
            </span>
        </div>
    );
}

function Section({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                paddingBottom: "0.5em",
                paddingTop: "0.5em",
                borderBottom: "0.5px solid var(--color-grey-lighter-dark)",
            }}
        >
            <p
                style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    margin: "0 0 6px 0",
                }}
            >
                {label}
            </p>
            {children}
        </div>
    );
}

export function AboutDialogueContent({ close }: AboutDialogueContentProps) {
    // Use UI appearance.
    const { colorTheme } = useAppearance();

    // Use environment.
    const { isDev } = useEnvironment();

    // Use build information.
    const [info] = useState<BuildInformation>(() =>
        window.electron.requestBuildInformation(),
    );

    // State for holding information if build data were copied.
    const [copied, setCopied] = useState(false);

    const osLabel = `${info.platform} ${info.osRelease} (${info.arch})`;

    const copyText = [
        `${info.app} ${info.appVersion}`,
        `Commit: ${info.commit}`,
        `Build date: ${info.buildDate}`,
        `Electron: ${info.electron}`,
        `Chromium: ${info.chrome}`,
        `Node.js: ${info.node}`,
        `OS: ${osLabel}`,
        `Molstar: ${info.molstarVersion}`,
        `Volsegtools: ${info.volsegtoolsVersion}`,
    ].join("\n");

    // Handler for copy action.
    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(copyText).then(() => {
            setCopied(true);
        });
    }, [copyText]);

    // Render the component.
    return (
        <div>
            {/* Header. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    paddingBottom: "1em",
                    borderBottom: "0.5px solid var(--color-grey-lighter-dark)",
                }}
            >
                <div
                    style={{
                        width: 54,
                        height: 54,
                        flexShrink: 0,
                    }}
                >
                    <img
                        src={desktopIcon}
                        title={`${info.app} ${info.appVersion}`}
                        alt={info.app}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
                <div>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            justifyContent: "flex-start",
                        }}
                    >
                        <p
                            style={{
                                fontSize: 19,
                                fontWeight: 545,
                                margin: "0 0 2px",
                            }}
                        >
                            {info.app}
                        </p>
                        {isDev ? (
                            <Badge
                                title="You are in developer mode."
                                color={colorTheme.primaryColor}
                            >
                                DEV
                            </Badge>
                        ) : (
                            <></>
                        )}
                    </div>
                    <p
                        style={{
                            fontSize: 12,
                            margin: 0,
                        }}
                    >
                        Tool for building reproducible visualizations of
                        processed volumetric data
                    </p>
                </div>
            </div>

            {/* Application section. */}
            <Section label="Application">
                <InfoRow label="Version" value={info.appVersion} />
                <InfoRow label="Commit" value={info.commit} />
                <InfoRow label="Build date" value={info.buildDate} />
            </Section>

            {/* Runtime section. */}
            <Section label="Runtime">
                <InfoRow label="Electron" value={info.electron} />
                <InfoRow label="Chromium" value={info.chrome} />
                <InfoRow label="Node.js" value={info.node} />
            </Section>

            {/* System section. */}
            <Section label="System">
                <InfoRow label="OS" value={osLabel} />
            </Section>

            {/* Dependencies section. */}
            <Section label="Dependencies">
                <InfoRow label="Molstar" value={info.molstarVersion} />
                <InfoRow label="Volsegtools" value={info.volsegtoolsVersion} />
            </Section>

            {/* Buttons. */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 16,
                    paddingTop: "2em",
                }}
            >
                <Button
                    variant="secondary"
                    size="small"
                    tooltip="Copies the build information."
                    label={copied ? "✓ Copied" : "Copy"}
                    onClick={handleCopy}
                />

                <Button
                    variant="secondary"
                    size="small"
                    tooltip="Closes the dialogue window."
                    label="OK"
                    onClick={close}
                />
            </div>
        </div>
    );
}
