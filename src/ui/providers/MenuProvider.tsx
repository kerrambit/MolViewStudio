/**
 * Copyright (c) 2025-now MolViewStudio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Marek Eibel
 */

import React, { useState, useRef } from "react";
import "../i18n";
import {
    MenuContext,
    type Dropdown,
    type Menu,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "./MenuContext";

type MenuProviderProps = {
    children: React.ReactNode;
    /**
     * Consumed once at the mount, exactly like a `useRef` initial value or
     * `useState`'s lazy initializer: later changes to this prop are
     * ignored.
     *
     * If the caller re-renders with a different `initialMenu`,
     * the menu will NOT update. Use the menu-mutation methods
     * (`addRootMenuItem`, `addSectionIntoRootItem`, etc.) or `LiveTask`
     * for anything that needs to react to later changes.
     */
    initialMenu: Menu | (() => Menu);
};

export function MenuProvider({ children, initialMenu }: MenuProviderProps) {
    // Menu state in the initial state.
    const [menu, setMenu] = useState<Menu>(initialMenu);

    // For replace/restore functionality. Keeps original `MenuItem` to be restored.
    const backups = useRef<Map<string, MenuItem>>(new Map());

    const addRootMenuItem = (item: RootMenuItem) => {
        setMenu((prev) => {
            return [...prev, item];
        });
    };

    const addSectionIntoRootItem = (
        rootMenuItemId: string,
        section: Section,
        index?: number,
    ) => {
        setMenu((prev) =>
            prev.map((root) => {
                if (root.id !== rootMenuItemId) return root;
                if (!Array.isArray(root.task)) return root;

                const newSections = [...root.task];

                if (
                    index !== undefined &&
                    index >= 0 &&
                    index <= newSections.length
                ) {
                    newSections.splice(index, 0, section);
                } else {
                    newSections.push(section);
                }

                return {
                    ...root,
                    task: newSections,
                };
            }),
        );
    };

    const addMenuItemIntoSection = (
        rootMenuItemId: string,
        sectionId: string,
        newItem: MenuItem,
        index?: number,
    ) => {
        const addItemToSection = (sections: Dropdown): Dropdown => {
            return sections.map((section) => {
                if (section.id === sectionId) {
                    const alreadyExists = section.items.some(
                        (item) => item.id === newItem.id,
                    );
                    if (alreadyExists) {
                        return section;
                    }

                    const newItems = [...section.items];

                    if (
                        index !== undefined &&
                        index >= 0 &&
                        index <= newItems.length
                    ) {
                        newItems.splice(index, 0, newItem);
                    } else {
                        newItems.push(newItem);
                    }

                    return {
                        ...section,
                        items: newItems,
                    };
                }

                const updatedItems = section.items.map((item) => {
                    if (Array.isArray(item.task)) {
                        return {
                            ...item,
                            task: addItemToSection(item.task),
                        };
                    }
                    return item;
                });

                return {
                    ...section,
                    items: updatedItems,
                };
            });
        };

        setMenu((prev) =>
            prev.map((root) => {
                if (root.id !== rootMenuItemId) return root;
                if (!Array.isArray(root.task)) return root;

                return {
                    ...root,
                    task: addItemToSection(root.task),
                };
            }),
        );
    };

    const deleteMenuItem = (menuItemId: string) => {
        const removeRecursive = (sections: Dropdown): Dropdown => {
            return sections.map((section) => {
                const filteredItems = section.items.filter(
                    (item) => item.id !== menuItemId,
                );

                const deeplyCleanedItems = filteredItems.map((item) => {
                    if (Array.isArray(item.task)) {
                        return {
                            ...item,
                            task: removeRecursive(item.task),
                        };
                    }
                    return item;
                });

                return {
                    ...section,
                    items: deeplyCleanedItems,
                };
            });
        };

        setMenu((prev) =>
            prev.map((root) => {
                if (!Array.isArray(root.task)) return root;
                return {
                    ...root,
                    task: removeRecursive(root.task),
                };
            }),
        );
    };

    const replaceMenuItem = (menuItemId: string, newItem: MenuItem) => {
        setMenu((prev) => {
            let foundOriginal: MenuItem | undefined;

            const searchRecursive = (sections: Dropdown) => {
                for (const section of sections) {
                    for (const item of section.items) {
                        if (item.id === menuItemId) foundOriginal = item;
                        else if (Array.isArray(item.task))
                            searchRecursive(item.task);
                    }
                }
            };

            for (const root of prev) {
                if (Array.isArray(root.task)) searchRecursive(root.task);
            }

            if (foundOriginal && !backups.current.has(menuItemId)) {
                backups.current.set(menuItemId, foundOriginal);
            }

            const doReplace = (sections: Dropdown): Dropdown => {
                return sections.map((sec) => ({
                    ...sec,
                    items: sec.items.map((item) => {
                        if (item.id === menuItemId) return newItem;
                        if (Array.isArray(item.task))
                            return { ...item, task: doReplace(item.task) };
                        return item;
                    }),
                }));
            };

            return prev.map((root) => {
                if (!Array.isArray(root.task)) return root;
                return { ...root, task: doReplace(root.task) };
            });
        });
    };

    const restoreMenuItem = (menuItemId: string) => {
        const originalItem = backups.current.get(menuItemId);

        if (originalItem) {
            setMenu((prev) => {
                const doReplace = (sections: Dropdown): Dropdown => {
                    return sections.map((sec) => ({
                        ...sec,
                        items: sec.items.map((item) => {
                            if (item.id === menuItemId) return originalItem;
                            if (Array.isArray(item.task))
                                return { ...item, task: doReplace(item.task) };
                            return item;
                        }),
                    }));
                };

                return prev.map((root) => {
                    if (!Array.isArray(root.task)) return root;
                    return { ...root, task: doReplace(root.task) };
                });
            });

            backups.current.delete(menuItemId);
        }
    };

    const deleteRootMenuItem = (id: string) => {
        let toDelete: RootMenuItem | undefined;

        setMenu((prevMenu) => {
            toDelete = prevMenu.find((item) => item.id === id);
            return prevMenu.filter((item) => item.id !== id);
        });

        return toDelete;
    };

    const retrieveIdByTitle = (name: string) => {
        return menu.find((item) => item.title === name)?.id;
    };

    return (
        <MenuContext.Provider
            value={{
                menu,
                setMenu,
                retrieveIdByTitle,
                deleteRootMenuItem,
                addRootMenuItem,
                addMenuItemIntoSection,
                addSectionIntoRootItem,
                deleteMenuItem,
                replaceMenuItem,
                restoreMenuItem,
            }}
        >
            {children}
        </MenuContext.Provider>
    );
}
