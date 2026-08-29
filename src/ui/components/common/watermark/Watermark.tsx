/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import type { TablerIcon } from "@tabler/icons-react";

interface WatermarkProps {
    icon: TablerIcon;
}

export default function Watermark(props: WatermarkProps) {
    return (
        <props.icon
            size={300}
            color="var(--mantine-color-dimmed)"
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 0.25,
            }}
        />
    );
}
