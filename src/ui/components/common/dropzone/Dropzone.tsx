import { type FileRejection } from "@mantine/dropzone";
import { useDropzone } from "react-dropzone";
import { IconDragDrop, type ReactNode } from "@tabler/icons-react";

import "./Dropzone.css";

export interface DropzoneProps {
    onDrop: (files: File[]) => void;
    onReject?: ((fileRejections: FileRejection[]) => void) | undefined;
    enableMultipleInputFiles?: boolean;
    children?: ReactNode;
    allowedExtensions?: string[];
}

export function Dropzone(props: DropzoneProps) {
    const { /*acceptedFiles, fileRejections,*/ getRootProps, getInputProps } =
        useDropzone({
            validator: createValidator(props.allowedExtensions ?? []),
            noClick: true,
            multiple: props.enableMultipleInputFiles,
            onDropAccepted(files, _) {
                props.onDrop(files);
            },
            onDropRejected(fileRejections, _) {
                if (props.onReject) {
                    props.onReject(fileRejections);
                }
            },
        });

    // const acceptedFileItems = acceptedFiles.map((file) => (
    //     <li key={file.path}>
    //         {file.path} - {file.size} bytes
    //     </li>
    // ));

    // const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    //     <li key={file.path}>
    //         {file.path} - {file.size} bytes
    //         <ul>
    //             {errors.map((e) => (
    //                 <li key={e.code}>{e.message}</li>
    //             ))}
    //         </ul>
    //     </li>
    // ));

    return (
        <section className="container dropzone">
            <div {...getRootProps({ className: "dropzone" })}>
                <input {...getInputProps()} />
                <div className="dropzone__body">
                    {props.children}
                    <div className="dropzone__state">
                        <IconDragDrop
                            size={160}
                            color="var(--mantine-color-dimmed)"
                            stroke={1.5}
                        />
                    </div>
                </div>
            </div>
        </section>
    );

    // return (
    //     <MantineDropZone
    //         className="dropzone"
    //         onDrop={props.onDrop}
    //         onReject={props.onReject}
    //         activateOnClick={false}
    //         multiple={props.enableMultipleInputFiles}
    //     >
    //         <div className="dropzone__body">
    //             {props.children}
    //             <div className="dropzone__state">
    //                 <MantineDropZone.Idle>
    //                     <IconDragDrop
    //                         size={160}
    //                         color="var(--mantine-color-dimmed)"
    //                         stroke={1.5}
    //                     />
    //                 </MantineDropZone.Idle>
    //             </div>
    //         </div>
    //     </MantineDropZone>
    // );
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
                message: `Unsupported extension <${file.name}>!`,
            };
        }

        return null;
    };
}
