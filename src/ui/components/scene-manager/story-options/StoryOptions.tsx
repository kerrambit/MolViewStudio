import { Text } from "@mantine/core";
import { UnstyledTextInput } from "../../common/input/UnstyledTextInput";
import { UnstyledTextArea } from "../../common/input/UnstyledTextArea";

interface StoryOptionsProps {
    title: string | undefined;
    onTitleChange: (newTitle: string | undefined) => void;
    description: string | undefined;
    onDescriptionChange: (newDescription: string | undefined) => void;
}

export function StoryOptions(props: StoryOptionsProps) {
    return (
        <div>
            <Text size="xl">Title</Text>
            <UnstyledTextInput
                value={props.title}
                placeholder="Enter title of your story..."
                tooltip={
                    props.title?.length === 0
                        ? "Enter title of your story..."
                        : "Change title of your story..."
                }
                onValueChange={props.onTitleChange}
                onBlur={props.onTitleChange}
                canBeEmpty={true}
            />

            <Text size="xl" mt="md">
                Description
            </Text>
            <UnstyledTextArea
                value={props.description}
                placeholder="Write your story description here..."
                tooltip="Write your story description here..."
                minRows={31}
                maxRows={31}
                onValueChange={props.onDescriptionChange}
                onBlur={props.onDescriptionChange}
            ></UnstyledTextArea>
        </div>
    );
}
