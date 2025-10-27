import React, { useEffect, type ReactNode } from "react";

import "./BaseDialogue.css";

interface BaseDialogueProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscapeEntered?: boolean;
    width?: string;
    maxWidth?: string;
}

export function BaseDialogue({
    isOpen,
    onClose,
    children,
    title,
    showCloseButton = true,
    closeOnBackdropClick = false,
    closeOnEscapeEntered = false,
    width = "500px",
    maxWidth = "80vw",
}: BaseDialogueProps) {
    // Prevents background page from scrolling.
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Registers Escape button to close the dialogue window.
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && closeOnEscapeEntered) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Closes the dialogue window when clicked on the blurred background.
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="base-dialogue__blurred-background"
            onClick={handleBackdropClick}
        >
            <div
                className="base-dialogue"
                style={{ width, maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className="base-dialogue__header">
                        {title && (
                            <h3 className="base-dialogue__title">{title}</h3>
                        )}
                        {showCloseButton && (
                            <button
                                className="base-dialogue__close-button"
                                onClick={onClose}
                                aria-label="Close dialogue"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
                <div className="base-dialogue__content">{children}</div>
            </div>
        </div>
    );
}

export default BaseDialogue;
