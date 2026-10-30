/**
 * Copyright (c) 2025-now VolSegStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import { ConfirmationDialogueContent } from "../../../dialogue/components/ConfirmationDialogueContent";
import { useDialogueStore } from "../../../dialogue/stores/dialogueStore";
import { pushErrorNotification } from "../../../notifications/services/NotificationService";
import { fetchDefaultMvsjFile } from "./fetchDefaultMvsjFile";

const IS_URL_RESOURCE_AVAILABLE = false; // Url 'https://raw.githubusercontent.com/molstar/molstar/master/examples/mvs/1cbs.mvsj' used in `fetchDefaultMvsjFile` returns 404 currently.

export async function loadDefaultMvsjFile() {
    if (!IS_URL_RESOURCE_AVAILABLE) {
        pushErrorNotification(
            `File cannot be currently loaded, as the file is not available!`,
        );
        return;
    }

    const confirmed = await useDialogueStore.getState().showDialogue<boolean>({
        title: "Confirmation",
        showCloseButton: false,
        content: (close) => (
            <ConfirmationDialogueContent
                close={close}
                doYouReallyWantToQuestion="Do you really want to load default MVSJ file?"
            />
        ),
    });
    if (confirmed) await fetchDefaultMvsjFile();
}
