/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useState } from "react";
import { Text } from "@mantine/core";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { UnstyledTextArea } from "../../../../../components/common/input/UnstyledTextArea";
import {
    useRegimeStore,
    type ViewingRegime,
} from "../../../../../stores/regimeStore";

export function StoryOptions() {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);
    if (regime.kind !== "viewing") return null;

    // Render the component.
    return (
        <StoryOptionsFields
            key={regime.history.current().timestamp}
            regime={regime}
        />
    );
}

function StoryOptionsFields({ regime }: { regime: ViewingRegime }) {
    // Metadata.
    const metadata = regime.history.current().stateTree.metadata;

    // Local title and description variables for controlled inputs.
    const [title, setTitle] = useState(metadata?.title ?? "");
    const [description, setDescription] = useState(metadata?.description ?? "");

    // Handler for change of metadata from UI.
    const commitMetadata = (
        key: "title" | "description",
        value: string | undefined,
    ) => {
        if (regime.kind !== "viewing") return;

        const currentMetadata =
            regime.history.current().stateTree.metadata || {};
        const prev = currentMetadata[key] ?? "";
        const next = value ?? "";

        // Nothing actually changed - don't touch history.
        if (prev === next) return;

        const newMetadata = { ...currentMetadata };

        if (!value) {
            delete newMetadata[key];
            if (key === "description") delete newMetadata.description_format;
        } else {
            newMetadata[key] = value;
            if (key === "description")
                newMetadata.description_format = "plaintext";
        }

        regime.commitStateTree(
            { ...regime.history.current().stateTree, metadata: newMetadata },
            "Updated title and description for the story.",
        );
    };

    // Render the component.
    return (
        <div>
            <Text size="xl">Title</Text>
            <UnstyledTextInput
                value={title}
                placeholder="Enter title of your story..."
                tooltip={title}
                bold={true}
                onValueChange={(newTitle) => newTitle && setTitle(newTitle)}
                onBlur={(newTitle) => commitMetadata("title", newTitle)}
                canBeEmpty={true}
            />

            <Text size="xl" mt="md">
                Description
            </Text>
            <UnstyledTextArea
                value={description}
                placeholder="Write your story description here."
                tooltip="Write your story description here."
                minRows={31}
                maxRows={31}
                onValueChange={(newDescription) =>
                    newDescription && setDescription(newDescription)
                }
                onBlur={(newDescription) =>
                    commitMetadata("description", newDescription)
                }
            />
        </div>
    );
}
