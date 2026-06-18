import { IconPlus } from "@tabler/icons-react";
import "./CreateViewCard.css";

interface CreateViewCardProps {
    onClick: () => void;
}

export function CreateViewCard(props: CreateViewCardProps) {
    return (
        <div
            className="createViewCard"
            onClick={props.onClick}
            title="Click to create new empty view."
        >
            <IconPlus size={28} />
            <span>Create new view</span>
        </div>
    );
}
