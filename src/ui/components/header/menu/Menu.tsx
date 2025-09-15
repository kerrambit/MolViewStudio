import { Badge, Button, Menu as MantineMenu } from "@mantine/core";
import { useTheme } from "../../../services/ThemeProvider";
import { useEffect, useState } from "react";
import {
    useMenu,
    type Action,
    type Dropdown,
    type MenuIcon,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../../services/MenuProvider";

import "./Menu.css";

interface MenuProps {
    className?: string;
}

export function Menu({ className = "" }: MenuProps) {
    const { theme } = useTheme();
    const { menu } = useMenu();

    const [isDev, setIsDev] = useState(false);
    useEffect(() => {
        window.electron.requestEnvironment().then((env) => {
            setIsDev(env.isDev);
        });
    }, []);

    return (
        <div className={className}>
            <span title="Mol* App (Version 0.0.1)" className="menu__title">
                Mol* App{" "}
                {isDev ? (
                    <Badge
                        title="You are in developer mode."
                        color={theme.primaryColor}
                    >
                        DEV
                    </Badge>
                ) : (
                    <></>
                )}
            </span>
            {/* TODO: sort root menu items based on priority */}
            {menu.map((menuItem, index) => {
                return renderRootMenuItem(menuItem, index);
            })}
        </div>
    );
}

// TODO: for all .map function usage, we need to assign unique key

function renderSection(section: Section, index: number) {
    return (
        <>
            {(!section.visible || section.visible()) && (
                <>
                    {index !== 0 && <MantineMenu.Divider />}
                    {section.title && (
                        <MantineMenu.Label>{section.title}</MantineMenu.Label>
                    )}
                    {section.items.map((item) => renderMenuItem(item))}
                </>
            )}
        </>
    );
}

function renderSubDropdown(dropdown: Dropdown) {
    return (
        <MantineMenu.Sub.Dropdown>
            {dropdown.map((section, index) => {
                return renderSection(section, index);
            })}
        </MantineMenu.Sub.Dropdown>
    );
}

function renderDropdown(dropdown: Dropdown) {
    return (
        <MantineMenu.Dropdown>
            {dropdown.map((section, index) => {
                return renderSection(section, index);
            })}
        </MantineMenu.Dropdown>
    );
}

function renderMenuItem(item: MenuItem) {
    if ("action" in item.task) {
        const task = item.task as Action;
        return (
            <>
                <MantineMenu.Item
                    onClick={() => {
                        task.action();
                    }}
                    {...renderIcon(item.icon)}
                >
                    {`${item.title}${task.type === "secondary" ? "..." : ""}`}
                </MantineMenu.Item>
            </>
        );
    }

    const task = item.task as Dropdown;
    return (
        <>
            <MantineMenu.Sub>
                <MantineMenu.Sub.Target>
                    <MantineMenu.Sub.Item {...renderIcon(item.icon)}>
                        {item.title}
                    </MantineMenu.Sub.Item>
                </MantineMenu.Sub.Target>
                {renderSubDropdown(task)}
            </MantineMenu.Sub>
        </>
    );
}

function renderRootMenuItem(item: RootMenuItem, index: number) {
    if ("action" in item.task) {
        const task = item.task as Action;
        return (
            <>
                <MantineMenu>
                    <MantineMenu.Target>
                        <Button
                            {...renderIcon(item.icon)}
                            className={`menu__toggle ${
                                index === 0 ? "menu__toggle--first" : ""
                            }`}
                            onClick={task.action}
                        >
                            {item.title}
                        </Button>
                    </MantineMenu.Target>
                </MantineMenu>{" "}
            </>
        );
    }

    const task = item.task as Dropdown;
    return (
        <>
            <MantineMenu>
                <MantineMenu.Target>
                    <Button
                        {...renderIcon(item.icon)}
                        className={`menu__toggle ${
                            index === 0 ? "menu__toggle--first" : ""
                        }`}
                    >
                        {item.title}
                    </Button>
                </MantineMenu.Target>
                {renderDropdown(task)}
            </MantineMenu>{" "}
        </>
    );
}

function renderIcon(icon: MenuIcon | undefined) {
    return icon
        ? icon.position === "left"
            ? { leftSection: <icon.icon size={16} /> }
            : { rightSection: <icon.icon size={16} /> }
        : {};
}
