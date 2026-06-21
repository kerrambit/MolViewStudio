import React, { useState } from "react";
import { Badge, Button, Menu as MantineMenu } from "@mantine/core";
import { useAppearance } from "../../../providers/AppearanceProvider";
import {
    useMenu,
    type Action,
    type Dropdown,
    type MenuIcon,
    type MenuItem,
    type RootMenuItem,
    type Section,
} from "../../../providers/MenuProvider";
import { useEnvironment } from "../../../hooks/useEnvironment";

import "./Menu.css";

interface MenuProps {
    className?: string;
}

export function Menu({ className = "" }: MenuProps) {
    // Use apperance.
    const { colorTheme } = useAppearance();

    // Use menu,
    const { menu } = useMenu();

    // Use environment.
    const { isDev } = useEnvironment();

    // Use build information.
    const [info] = useState<BuildInformation>(() =>
        window.electron.requestBuildInformation(),
    );

    // Render the component.
    return (
        <div className={className}>
            <span
                title={`MolView Studio (Version ${info.appVersion})`}
                className="menu__title"
            >
                MolView Studio{" "}
                {isDev ? (
                    <Badge
                        title="You are in developer mode."
                        color={colorTheme.primaryColor}
                    >
                        DEV
                    </Badge>
                ) : (
                    <></>
                )}
            </span>
            {menu
                .sort((a, b) => a.priority - b.priority)
                .map((menuItem, index) => (
                    <React.Fragment key={menuItem.id}>
                        {renderRootMenuItem(menuItem, index)}
                    </React.Fragment>
                ))}
        </div>
    );
}

function renderSubDropdown(dropdown: Dropdown) {
    return (
        <MantineMenu.Sub.Dropdown>
            {dropdown.map((section, index) => (
                <React.Fragment key={section.id}>
                    {renderSection(section, index)}
                </React.Fragment>
            ))}
        </MantineMenu.Sub.Dropdown>
    );
}

function renderDropdown(dropdown: Dropdown) {
    return (
        <MantineMenu.Dropdown>
            {dropdown.map((section, index) => (
                <React.Fragment key={section.id}>
                    {renderSection(section, index)}
                </React.Fragment>
            ))}
        </MantineMenu.Dropdown>
    );
}

interface MenuListProcessorProps {
    items: MenuItem[];
    renderItem: (item: MenuItem) => React.ReactNode;
}

/**
 * Iterates through items and safely handles executing individual item hooks
 * without disrupting Mantine's element inspection layers.
 */
function MenuListProcessor({ items, renderItem }: MenuListProcessorProps) {
    return (
        <>
            {items.map((item) => {
                if (item.LiveTask) {
                    const LiveTaskComponent = item.LiveTask;
                    return (
                        <LiveTaskComponent
                            key={item.id}
                            render={(dynamicTaskArray) =>
                                renderItem({ ...item, task: dynamicTaskArray })
                            }
                        />
                    );
                }

                return (
                    <React.Fragment key={item.id}>
                        {renderItem(item)}
                    </React.Fragment>
                );
            })}
        </>
    );
}

function renderSection(section: Section, index: number) {
    return (
        <>
            {(!section.visible || section.visible()) && (
                <>
                    {index !== 0 && <MantineMenu.Divider />}
                    {section.title && (
                        <MantineMenu.Label>{section.title}</MantineMenu.Label>
                    )}
                    <MenuListProcessor
                        items={section.items}
                        renderItem={(item) => renderMenuItem(item)}
                    />
                </>
            )}
        </>
    );
}

function renderMenuItem(item: MenuItem) {
    if ("action" in item.task) {
        const task = item.task as Action;
        return (
            <MantineMenu.Item onClick={task.action} {...renderIcon(item.icon)}>
                {`${item.title}${task.type === "secondary" ? "..." : ""}`}
            </MantineMenu.Item>
        );
    }

    const task = item.task as Dropdown;
    return (
        <MantineMenu.Sub>
            <MantineMenu.Sub.Target>
                <MantineMenu.Sub.Item {...renderIcon(item.icon)}>
                    {item.title}
                </MantineMenu.Sub.Item>
            </MantineMenu.Sub.Target>
            {renderSubDropdown(task)}
        </MantineMenu.Sub>
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
