import { Avatar as MantineAvatar } from "@mantine/core";

import "./Avatar.css";
import { useTheme } from "../../../services/ThemeProvider";

export function Avatar() {
    const { theme } = useTheme();

    const user = {
        name: "John Doe",
    };

    return (
        <MantineAvatar
            className="avatar"
            title={`Signed account: ${user.name}`}
            variant="filled"
            key={user.name}
            name={user.name}
            color={theme.primaryColor}
            size="md"
            onClick={() => console.log("Clicked on avatar.")}
        />
    );
}
