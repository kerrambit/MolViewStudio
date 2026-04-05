import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";
import BaseDialogue from "../components/common/dialogue/BaseDialogue";

export interface DialogueProps<ReturnValueType = any> {
    title?: string;
    content: (close: (value?: ReturnValueType) => void) => ReactNode;
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscapeEntered?: boolean;
    width?: string;
    maxWidth?: string;
}

interface StackedDialogue {
    id: string;
    options: DialogueProps;
    resolve: (value?: any) => void;
}

export type DialogueContextType = {
    showDialogue: <T = void>(
        options: DialogueProps<T>,
    ) => Promise<T | undefined>;
    closeDialogue: (id: string) => void;
};

const DialogueContext = createContext<DialogueContextType | undefined>(
    undefined,
);

export function useDialogue() {
    const context = useContext(DialogueContext);
    if (!context) {
        throw new Error("Dialogue must be used within a DialogueProvider!");
    }
    return context;
}

export function DialogueProvider({ children }: { children: ReactNode }) {
    const [stack, setStack] = useState<StackedDialogue[]>([]);

    const showDialogue = useCallback(
        <T = void,>(options: DialogueProps<T>): Promise<T | undefined> => {
            return new Promise<T | undefined>((resolve) => {
                const id = crypto.randomUUID();
                setStack((prev) => [
                    ...prev,
                    { id, options: options as DialogueProps<any>, resolve },
                ]);
            });
        },
        [],
    );

    const closeDialogue = useCallback((id: string, value?: any) => {
        setStack((prev) => {
            const dialogue = prev.find((d) => d.id === id);
            if (dialogue) {
                dialogue.resolve(value);
            }
            return prev.filter((d) => d.id !== id);
        });
    }, []);

    return (
        <DialogueContext.Provider value={{ showDialogue, closeDialogue }}>
            {children}
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
        </DialogueContext.Provider>
    );
}
