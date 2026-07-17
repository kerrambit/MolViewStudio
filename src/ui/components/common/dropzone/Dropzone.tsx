import { type FileRejection } from "@mantine/dropzone";
import { useDropzone, type DropEvent } from "react-dropzone";
import { IconDragDrop, IconX, type ReactNode } from "@tabler/icons-react";

import "./Dropzone.css";

export interface DropzoneProps {
    onDrop: (files: File[]) => void;
    onReject?: ((fileRejections: FileRejection[]) => void) | undefined;
    enableMultipleInputFiles?: boolean;
    children?: ReactNode;
    allowedExtensions?: string[];
    getFilesFromEvent?: (event: DropEvent) => Promise<File[]>;
}

export function Dropzone(props: DropzoneProps) {
    const { fileRejections, getRootProps, getInputProps } = useDropzone({
        validator: createValidator(props.allowedExtensions ?? []),
        noClick: true,
        multiple: props.enableMultipleInputFiles,
        onDropAccepted(files) {
            props.onDrop(files);
        },
        onDropRejected(fileRejections) {
            if (props.onReject) {
                props.onReject(fileRejections);
            }
        },
        getFilesFromEvent: props.getFilesFromEvent,
    });

    return (
        <section className="container dropzone">
            <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                <div className="dropzone__body">
                    {props.children}
                    <div className="dropzone__state">
                        {fileRejections.length > 0 ? (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <IconX
                                    size={160}
                                    color="var(--mantine-color-red-filled)"
                                    stroke={2}
                                />
                                <p className="dropzone__error">
                                    Some files were rejected. Please check the
                                    file types and try again.
                                    <br />
                                    Details: <br />
                                    {fileRejections
                                        .flatMap((rej) =>
                                            rej.errors.map(
                                                (err) => err.message,
                                            ),
                                        )
                                        .map((msg, idx, arr) => (
                                            <span key={idx}>
                                                {msg}
                                                {idx < arr.length - 1
                                                    ? ", "
                                                    : null}
                                                <br />
                                            </span>
                                        ))}
                                </p>
                            </div>
                        ) : (
                            <IconDragDrop
                                size={160}
                                color="var(--mantine-color-dimmed)"
                                stroke={1.5}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function createValidator(allowedExtensions: string[]) {
    return (file: File) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (
            !extension ||
            !allowedExtensions.map((e) => e.toLowerCase()).includes(extension)
        ) {
            return {
                code: "unsupported-file-extension",
                message: `Unsupported extension <${extension}> for file <${
                    file.name
                }>! Supported extensions are ${allowedExtensions.join(", ")}.`,
            };
        }

        return null;
    };
}
