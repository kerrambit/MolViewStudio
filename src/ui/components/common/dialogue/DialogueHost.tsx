/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { useDialogueStore } from "../../../stores/dialogueStore";
import BaseDialogue from "./BaseDialogue";

/**
 * Use as root context component which reacts to changes inside dialogue store, see `main.tsx`.
 */
export function DialogueHost() {
    const stack = useDialogueStore((state) => state.stack);
    const closeDialogue = useDialogueStore((state) => state.closeDialogue);

    // Render the component.
    return (
        <>
            {stack.map((dialogue) => (
                <BaseDialogue
                    key={dialogue.id}
                    isOpen={true}
                    onClose={() => closeDialogue(dialogue.id, undefined)}
                    title={dialogue.options.title}
                    showCloseButton={dialogue.options.showCloseButton}
                    closeOnBackdropClick={dialogue.options.closeOnBackdropClick}
                    closeOnEscapeEntered={dialogue.options.closeOnEscapeEntered}
                    width={dialogue.options.width}
                    maxWidth={dialogue.options.maxWidth}
                >
                    {dialogue.options.content((value) =>
                        closeDialogue(dialogue.id, value),
                    )}
                </BaseDialogue>
            ))}
        </>
    );
}
