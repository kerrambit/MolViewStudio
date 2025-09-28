import {
    Dropzone as MantineDropZone,
    type FileRejection,
    type FileWithPath,
} from "@mantine/dropzone";
import {
    IconDragDrop,
    IconUpload,
    IconX,
    type ReactNode,
} from "@tabler/icons-react";

import "./Dropzone.css";

export type Extension = string;

export type Accept = {
    [mimeType: string]: Extension[];
};

export interface DropzoneProps {
    onDrop: (files: FileWithPath[]) => void;
    onReject?: ((fileRejections: FileRejection[]) => void) | undefined;
    enableMultipleInputFiles?: boolean;
    children?: ReactNode;
    accept?: Accept;
}

export function Dropzone(props: DropzoneProps) {
    return (
        <MantineDropZone
            className="dropzone"
            onDrop={props.onDrop}
            onReject={props.onReject}
            activateOnClick={false}
            multiple={props.enableMultipleInputFiles}
            accept={props.accept}
        >
            <div className="dropzone__body">
                {props.children}
                <div className="dropzone__state">
                    <MantineDropZone.Accept>
                        <IconUpload
                            size={160}
                            color="var(--mantine-color-blue-6)"
                            stroke={1.5}
                        />
                    </MantineDropZone.Accept>
                    <MantineDropZone.Reject>
                        <IconX
                            size={160}
                            color="var(--mantine-color-red-6)"
                            stroke={1.5}
                        />
                    </MantineDropZone.Reject>
                    <MantineDropZone.Idle>
                        <IconDragDrop
                            size={160}
                            color="var(--mantine-color-dimmed)"
                            stroke={1.5}
                        />
                    </MantineDropZone.Idle>
                </div>
            </div>
        </MantineDropZone>
    );
}
