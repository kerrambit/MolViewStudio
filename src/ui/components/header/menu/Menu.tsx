import { Badge, Button, Menu as MantineMenu } from "@mantine/core";
import "./Menu.css";
import {
    IconChartBubbleFilled,
    IconCircleDashedX,
    IconFileTime,
    IconFolderOpen,
    IconSettingsFilled,
    IconUserCog,
} from "@tabler/icons-react";
import { useTheme } from "../../../services/ThemeProvider";

interface MenuProps {
    className?: string;
}

export function Menu({ className = "" }: MenuProps) {
    const { theme } = useTheme();
    const isDev = true; // TODO: create electron API endpoint for this

    return (
        <div className={className}>
            <MantineMenu>
                <span title="Mol* App (Version 0.0.1)" className="menu__title">
                    Mol* App{" "}
                    {isDev ? (
                        <Badge color={theme.primaryColor}>DEV</Badge>
                    ) : (
                        <></>
                    )}
                </span>
                <MantineMenu.Target>
                    <Button className="menu__toggle menu__toggle--first">
                        File
                    </Button>
                </MantineMenu.Target>
                <MantineMenu.Dropdown>
                    <MantineMenu.Item
                        leftSection={<IconFolderOpen size={14} />}
                    >
                        Open...
                    </MantineMenu.Item>

                    <MantineMenu.Sub>
                        <MantineMenu.Sub.Target>
                            <MantineMenu.Sub.Item
                                leftSection={<IconFileTime size={14} />}
                            >
                                Open recent...
                            </MantineMenu.Sub.Item>
                        </MantineMenu.Sub.Target>

                        <MantineMenu.Sub.Dropdown>
                            <MantineMenu.Item
                                leftSection={
                                    <IconChartBubbleFilled size={14} />
                                }
                            >
                                /home/user/data/emd-1832.cvsx
                            </MantineMenu.Item>
                        </MantineMenu.Sub.Dropdown>
                    </MantineMenu.Sub>

                    <MantineMenu.Item
                        leftSection={<IconSettingsFilled size={14} />}
                    >
                        Settings...
                    </MantineMenu.Item>

                    <MantineMenu.Divider />

                    <MantineMenu.Label>For developers</MantineMenu.Label>
                    <MantineMenu.Item
                        leftSection={
                            <IconUserCog
                                size={14}
                                onClick={() => console.log("Open DevTools")}
                            />
                        }
                    >
                        Open DevTools
                    </MantineMenu.Item>

                    <MantineMenu.Divider />
                    <MantineMenu.Item
                        leftSection={<IconCircleDashedX size={14} />}
                    >
                        Exit
                    </MantineMenu.Item>
                </MantineMenu.Dropdown>
            </MantineMenu>{" "}
            <MantineMenu>
                <MantineMenu.Target>
                    <Button className="menu__toggle">Window</Button>
                </MantineMenu.Target>
            </MantineMenu>{" "}
            <MantineMenu>
                <MantineMenu.Target>
                    <Button className="menu__toggle">Help</Button>
                </MantineMenu.Target>
            </MantineMenu>{" "}
        </div>
    );
}
