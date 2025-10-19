import React, {
    createContext,
    useState,
    useContext,
    type ForwardRefExoticComponent,
    type RefAttributes,
} from "react";
import "../i18n";
import {
    IconCircleDashedX,
    IconUserCog,
    type Icon,
    type IconProps,
} from "@tabler/icons-react";

/**
 * The action can be either:
 * - `direct`: the action is executed immediately.
 * - `secondary`: the action triggers an intermediate step,
 *   such as opening a file explorer or another dialog, before
 *   the actual action runs.
 */
export type ActionType = "direct" | "secondary";

export type MenuIcon = {
    icon:
        | ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
        | React.ComponentType<React.SVGProps<SVGSVGElement>>;
    position: "left" | "right";
};

export type Section = {
    id: string;
    title?: string;
    items: MenuItem[];
    visible?: () => boolean;
};

export type Dropdown = Section[];

export type Action = {
    action: () => void;
    type: ActionType;
};

export type MenuItem = {
    id: string;
    title: string;
    icon?: MenuIcon;
    task: Dropdown | Action;
};

/**
 * The highest priority is 1. The lowest is 10. The root menu items are sorted according to priority.
 */
export type Priority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type RootMenuItem = MenuItem & { priority: Priority };

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
        newItem: MenuItem
    ) => void;
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
    isDev: boolean;
    navigate: (path: string) => void;
};

export function MenuProvider({ children, isDev, navigate }: MenuProviderProps) {
    const [menu, setMenu] = useState<Menu>(() =>
        createInitialMenu(isDev, navigate)
    );

    const addRootMenuItem = (item: RootMenuItem) => {
        setMenu((prev) => {
            return [...prev, item];
        });
    };

    const addMenuItemIntoSection = (
        rootMenuItemId: string,
        sectionId: string,
        newItem: MenuItem
    ) => {
        const addItemToSection = (sections: Dropdown): Dropdown => {
            return sections.map((section) => {
                if (section.id === sectionId) {
                    const alreadyExists = section.items.some(
                        (item) => item.id === newItem.id
                    );
                    if (alreadyExists) {
                        return section;
                    }
                    return {
                        ...section,
                        items: [...section.items, newItem],
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
            })
        );
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
            }}
        >
            {children}
        </MenuContext.Provider>
    );
}

function createInitialMenu(
    isDev: boolean,
    navigate: (path: string) => void
): Menu {
    // TODO: translate titles

    const openDevTools: MenuItem = {
        id: crypto.randomUUID(),
        title: "Open DevTools",
        icon: { icon: IconUserCog, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenDevTools();
            },
            type: "direct",
        },
    };
    const exit: MenuItem = {
        id: crypto.randomUUID(),
        title: "Exit",
        icon: { icon: IconCircleDashedX, position: "left" },
        task: {
            action: () => {
                window.electron.requestApplicationExit();
            },
            type: "direct",
        },
    };
    const generalFileSection: Section = {
        id: "general-file",
        items: [],
    };
    const devFileSection: Section = {
        id: crypto.randomUUID(),
        title: "For developers",
        visible: () => {
            return isDev;
        },
        items: [openDevTools],
    };
    const exitSection: Section = {
        id: crypto.randomUUID(),
        items: [exit],
    };
    const file: RootMenuItem = {
        id: "file",
        title: "File",
        task: [generalFileSection, devFileSection, exitSection],
        priority: 1,
    };
    const settings: RootMenuItem = {
        id: crypto.randomUUID(),
        title: "Settings",
        task: {
            action: () => {
                navigate("/settings");
            },
            type: "direct",
        },
        priority: 5,
    };
    const help: RootMenuItem = {
        id: crypto.randomUUID(),
        title: "Help",
        task: [],
        priority: 10,
    };

    return [file, settings, help];
}
