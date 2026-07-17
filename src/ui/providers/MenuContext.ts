import type { Icon, IconProps } from "@tabler/icons-react";
import {
    createContext,
    type ForwardRefExoticComponent,
    type RefAttributes,
} from "react";

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
 * Context payload passed to items that implement dynamic re-renders.
 */
export type LiveMenuRenderProps = {
    // Allows plugins to dynamically return an entirely fresh layout task array.
    render: (liveDropdownTask: Dropdown | Action) => React.ReactNode;
};

/**
 * Type for the LiveTask object.
 */
export type LiveTaskType = React.ComponentType<LiveMenuRenderProps>;

/**
 * Belongs to given `Section`. Can have tree-like structure, either leaf as `Action` or parent node as `Dropdown`, meaning another section can be opened in it.
 */
export type MenuItem = {
    id: string;
    title: string;
    icon?: MenuIcon;
    task: Dropdown | Action;
    /**
     * Optional reactive hook layer. If provided, this functional component
     * overrides normal processing, allowing internal usage of useEffect or hooks.
     */
    LiveTask?: LiveTaskType;
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
