import { create } from "zustand";
import type React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DialogueProps<ReturnValueType = any> {
    title?: string;
    content: (close: (value?: ReturnValueType) => void) => React.ReactNode;
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscapeEntered?: boolean;
    width?: string;
    maxWidth?: string;
}

type StackedDialogue = {
    id: string;
    options: DialogueProps;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value?: any) => void;
};

export type ShowDialogueType = <T = void>(
    options: DialogueProps<T>,
) => Promise<T | undefined>;

type DialogueStore = {
    stack: StackedDialogue[];
    showDialogue: ShowDialogueType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    closeDialogue: (id: string, value?: any) => void;
};

export const useDialogueStore = create<DialogueStore>((set, get) => ({
    stack: [],

    showDialogue: (options) => {
        return new Promise((resolve) => {
            const id = crypto.randomUUID();
            set((state) => ({
                stack: [
                    ...state.stack,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    { id, options: options as DialogueProps<any>, resolve },
                ],
            }));
        });
    },

    closeDialogue: (id, value) => {
        const dialogue = get().stack.find((d) => d.id === id);
        dialogue?.resolve(value);
        set((state) => ({ stack: state.stack.filter((d) => d.id !== id) }));
    },
}));
