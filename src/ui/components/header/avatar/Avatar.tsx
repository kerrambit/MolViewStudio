import { Avatar as MantineAvatar } from "@mantine/core";
import { useAppearance } from "../../../services/AppearanceProvider";

import "./Avatar.css";

export function Avatar() {
    const { colorTheme } = useAppearance();

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
            color={colorTheme.primaryColor}
            size="md"
            onClick={() => console.log("Clicked on avatar.")}
        />
    );
}
