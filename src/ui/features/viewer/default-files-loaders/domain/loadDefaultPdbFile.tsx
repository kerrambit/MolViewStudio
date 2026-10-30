/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ConfirmationDialogueContent } from "../../../dialogue/components/ConfirmationDialogueContent";
import { useDialogueStore } from "../../../dialogue/stores/dialogueStore";
import { fetchDefaultPdbFile } from "./fetchDefaultPdbFile";

export async function loadDefaultPdbFile() {
    const confirmed = await useDialogueStore.getState().showDialogue<boolean>({
        title: "Confirmation",
        showCloseButton: false,
        content: (close) => (
            <ConfirmationDialogueContent
                close={close}
                doYouReallyWantToQuestion="Do you really want to load default PDB file?"
            />
        ),
    });
    if (confirmed) await fetchDefaultPdbFile();
}
