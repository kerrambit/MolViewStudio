import React, {
    createContext,
    useState,
    type ReactNode,
    useContext,
    type ForwardRefExoticComponent,
    type RefAttributes,
    useEffect,
} from "react";
import "../i18n";
import {
    IconChartBubbleFilled,
    IconCircleDashedX,
    IconFileTime,
    IconFolderOpen,
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
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    position: "left" | "right";
};

export type Section = {
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
};

export const MenuContext = createContext<MenuContextType | null>(null);

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error("Menu must be used within MenuProvider");
    }
    return context;
}

export function MenuProvider({ children }: { children: ReactNode }) {
    const [isDev, setIsDev] = useState(false);
    const [menu, setMenu] = useState<Menu>(() => createInitialMenu(false));

    useEffect(() => {
        window.electron.requestEnvironment().then((env) => {
            setIsDev(env.isDev);
        });
    }, []);

    useEffect(() => {
        setMenu(createInitialMenu(isDev));
    }, [isDev]);

    return (
        <MenuContext.Provider value={{ menu, setMenu }}>
            {children}
        </MenuContext.Provider>
    );
}

function createInitialMenu(isDev: boolean): Menu {
    const openFileInViewer: MenuItem = {
        title: "Open file in viewer",
        icon: { icon: IconFolderOpen, position: "left" },
        task: {
            action: () => {
                console.log("Open file in viewer...");
            },
            type: "secondary",
        },
    };
    const processFile: MenuItem = {
        title: "Process file",
        icon: { icon: IconFolderOpen, position: "left" },
        task: {
            action: () => {
                console.log("Process file...");
            },
            type: "secondary",
        },
    };
    const exampleFile: MenuItem = {
        title: "/home/user/data/emd-1832.cvsx",
        icon: { icon: IconChartBubbleFilled, position: "left" },
        task: {
            action: () => {
                console.log("Loading recent file...");
            },
            type: "direct",
        },
    };
    const openRecentFile: MenuItem = {
        title: "Open recent file",
        icon: { icon: IconFileTime, position: "left" },
        task: [{ items: [exampleFile] }],
    };
    const openDevTools: MenuItem = {
        title: "Open DevTools",
        icon: { icon: IconUserCog, position: "left" },
        task: {
            action: () => {
                window.electron.requestToOpenDevTools();
            },
            type: "secondary",
        },
    };
    const exit: MenuItem = {
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
        items: [openFileInViewer, processFile, openRecentFile],
    };
    const devFileSection: Section = {
        title: "For developers",
        visible: () => {
            return isDev;
        },
        items: [openDevTools],
    };
    const exitSection: Section = {
        items: [exit],
    };
    const file: RootMenuItem = {
        title: "File",
        task: [generalFileSection, devFileSection, exitSection],
        priority: 1,
    };
    const settings: RootMenuItem = {
        title: "Settings",
        task: {
            action: () => {
                console.log("Open settings");
            },
            type: "direct",
        },
        priority: 8,
    };
    const help: RootMenuItem = {
        title: "Help",
        task: [],
        priority: 10,
    };

    return [file, settings, help];
}
