import React, {
    createContext,
    useState,
    useContext,
    type ForwardRefExoticComponent,
    type RefAttributes,
    useRef,
} from "react";
import "../i18n";
import { type Icon, type IconProps } from "@tabler/icons-react";
import {
    createAboutMenuItem,
    createAboutSection,
    createCheckForUpdatesMenuItem,
    createCheckForUpdatesSection,
    createCreateNewProjectMenuItem,
    createExitMenuItem,
    createExitSection,
    createFileImportSection,
    createFileRootMenuItem,
    createGeneralHelpSection,
    createHelpRootMenuItem,
    createMolstarAppMenuItem,
    createMolstarMenuItem,
    createOnlyDevSection,
    createOpenDevToolsMenuItem,
    createOpenFileInViewerMenuItem,
    createOpenUserDataFolderMenuItem,
    createProcessFileMenuItem,
    createProjectActionsSection,
    createReportIssueMenuItem,
    createSettingsRootMenuItem,
    createUtilitiesSection,
} from "../config/systemMenuItems";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useFileManagement } from "../features/workspace/hooks/useFileManagement";
import { AboutDialogueContent } from "../components/common/dialogue/AboutDialogueContent";
import { useDialogue, type DialogueProps } from "./DialogueProvider";
import { pushErrorNotification } from "../services/NotificationService";

/**
 * The action can be either:
 * - `direct`: the action is executed immediately.
 * - `secondary`: the action triggers an intermediate step,
 * such as opening a file explorer or another dialog, before
 * the actual action runs.
 */
export type ActionType = "direct" | "secondary";

/**
 * Type for the icon of menu items.
 */
export type MenuIcon = {
    icon:
        | ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
        | React.ComponentType<React.SVGProps<SVGSVGElement>>;
    position: "left" | "right";
};

/**
 * Section groups `MenuItem` inside one `RootMenuItem`. One `RootMenuItem` can have any number of `Section`.
 */
export type Section = {
    id: string;
    title?: string;
    items: MenuItem[];
    /**
     * Section can be made hidden according to some condition.
     */
    visible?: () => boolean;
};

/**
 * Dropdown is collection of `Section`.
 */
export type Dropdown = Section[];

/**
 * Action does not group `MenuItem` as `Dropdown`, it has just one direct function assigned to it.
 */
export type Action = {
    action: () => void;
    type: ActionType;
};

/**
 * Belongs to given `Section`. Can have tree-like structure, either leaf as `Action` or parent node as `Dropdown`, meaning another section can be opened in it.
 */
export type MenuItem = {
    id: string;
    title: string;
    icon?: MenuIcon;
    task: Dropdown | Action;
};

/**
 * The highest priority is 1. The lowest is 10. Collection of `RootMenuItem` is sorted according to the priority.
 */
export type Priority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Parent of all `MenuItem`.
 */
export type RootMenuItem = MenuItem & { priority: Priority };

/**
 * Menu consists of individual `RootMenuItem` objects.
 */
export type Menu = RootMenuItem[];

type MenuContextType = {
    menu: Menu;
    setMenu: React.Dispatch<React.SetStateAction<Menu>>;
    addRootMenuItem: (item: RootMenuItem) => void;
    deleteRootMenuItem: (id: string) => RootMenuItem | undefined;
    retrieveIdByTitle: (name: string) => string | undefined;
    addMenuItemIntoSection: (
        rootMenuItemId: string,
        sectionId: string,
        newItem: MenuItem,
        index?: number,
    ) => void;
    addSectionIntoRootItem: (
        rootMenuItemId: string,
        section: Section,
        index?: number,
    ) => void;
    deleteMenuItem: (menuItemId: string) => void;
    replaceMenuItem: (menuItemId: string, newItem: MenuItem) => void;
    restoreMenuItem: (menuItemId: string) => void;
};

export const MenuContext = createContext<MenuContextType | null>(null);

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error("Menu must be used within MenuProvider");
    }
    return context;
}

type MenuProviderProps = {
    children: React.ReactNode;
};

export function MenuProvider({ children }: MenuProviderProps) {
    // Use navigation.
    const navigate = useNavigate();

    // Use file management.
    const { loadAndHandleFile, handleBlankProject } = useFileManagement();

    // Use dialogue.
    const { showDialogue } = useDialogue();

    // Menu state in the initial state.
    const [menu, setMenu] = useState<Menu>(() =>
        createInitialMenu(
            navigate,
            showDialogue,
            loadAndHandleFile,
            handleBlankProject,
        ),
    );

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

function createInitialMenu(
    navigate: NavigateFunction,
    showDialogue: <T = void>(
        options: DialogueProps<T>,
    ) => Promise<T | undefined>,
    loadAndHandleFile: (regimeKind: "viewing" | "processing") => Promise<void>,
    handleBlankProject: () => void,
): Menu {
    return [
        createFileRootMenuItem([
            createProjectActionsSection([
                createCreateNewProjectMenuItem(() => {
                    handleBlankProject();
                }),
            ]),
            createFileImportSection([
                createOpenFileInViewerMenuItem(() =>
                    loadAndHandleFile("viewing"),
                ),
                createProcessFileMenuItem(() =>
                    loadAndHandleFile("processing"),
                ),
            ]),
            createUtilitiesSection([
                createOpenUserDataFolderMenuItem(async () => {
                    const result =
                        await window.electron.requestToOpenUserDataFolder();
                    if (result instanceof Error) {
                        pushErrorNotification(
                            `Not able to open user data folder! Details: <${result.message}>.`,
                        );
                    }
                }),
            ]),
            createOnlyDevSection("file-dev", "For developers", [
                createOpenDevToolsMenuItem(),
            ]),
            createExitSection([createExitMenuItem()]),
        ]),
        createSettingsRootMenuItem(navigate),
        createHelpRootMenuItem([
            createGeneralHelpSection([
                createMolstarAppMenuItem(),
                createMolstarMenuItem(),
                createReportIssueMenuItem(),
            ]),
            createCheckForUpdatesSection([createCheckForUpdatesMenuItem()]),
            createAboutSection([
                createAboutMenuItem(async () => {
                    await showDialogue({
                        title: "About",
                        showCloseButton: true,
                        content: (close) => (
                            <AboutDialogueContent close={close} />
                        ),
                    });
                }),
            ]),
        ]),
    ];
}
