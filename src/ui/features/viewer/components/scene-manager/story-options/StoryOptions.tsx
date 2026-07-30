import { Text } from "@mantine/core";
import { UnstyledTextInput } from "../../../../../components/common/input/UnstyledTextInput";
import { UnstyledTextArea } from "../../../../../components/common/input/UnstyledTextArea";
import { useRegimeStore } from "../../../../../stores/regimeStore";

export function StoryOptions() {
    // Use regime.
    const regime = useRegimeStore((state) => state.regime);

    // View metadata.
    const metadata =
        regime.kind === "viewing"
            ? regime.history.current().metadata
            : undefined;

    // Handler for change of metadata from UI.
    const handleUpdateMetadata = (
        key: "title" | "description",
        value: string | undefined,
    ) => {
        if (regime.kind !== "viewing") return;

        if (value === "") {
            value = undefined;
        }

        const newMetadata = { ...(regime.history.current().metadata || {}) };

        if (value === undefined) {
            delete newMetadata[key];

            if (key === "description") {
                delete newMetadata.description_format;
            }
        } else {
            newMetadata[key] = value;

            if (key === "description") {
                newMetadata.description_format = "plaintext";
            }
        }

        regime.commitStateTree({
            ...regime.history.current(),
            metadata: newMetadata,
        });
    };

    // Render the component.
    return (
        <div>
            <Text size="xl">Title</Text>
            <UnstyledTextInput
                value={metadata?.title}
                placeholder="Enter title of your story..."
                tooltip={metadata?.title}
                bold={true}
                onValueChange={(newTitle) =>
                    handleUpdateMetadata("title", newTitle)
                }
                onBlur={(newTitle) => handleUpdateMetadata("title", newTitle)}
                canBeEmpty={true}
            />

            <Text size="xl" mt="md">
                Description
            </Text>
            <UnstyledTextArea
                value={metadata?.description}
                placeholder="Write your story description here."
                tooltip="Write your story description here."
                minRows={31}
                maxRows={31}
                onValueChange={(newDescription) =>
                    handleUpdateMetadata("description", newDescription)
                }
                onBlur={(newDescription) =>
                    handleUpdateMetadata("description", newDescription)
                }
            />
        </div>
    );
}
