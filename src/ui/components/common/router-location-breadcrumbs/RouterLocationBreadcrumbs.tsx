import { useLocation } from "react-router-dom";

interface RouterLocationBreadcrumbsProps {
    /**
     * Array of location synonyms allowing to change a location string to different string.
     */
    locationSynonyms?: { location: string; synonym: string }[];
}

/**
 * `RouterLocationBreadcrumbs` is a general component rendering breadcrumbs UI component based on the current router location.
 */
export function RouterLocationBreadcrumbs({
    locationSynonyms,
}: RouterLocationBreadcrumbsProps) {
    // Use location.
    const location = useLocation();

    const pathParts = location.pathname
        .split("/")
        .filter(Boolean)
        .map((part) => {
            const match = locationSynonyms?.find(
                (s) => s.location.toLowerCase() === part.toLowerCase(),
            );
            if (match) return match.synonym;
            return part.charAt(0).toUpperCase() + part.slice(1);
        });

    // Render the component.
    return <h1 style={{ marginBottom: "0" }}>{pathParts.join(" – ")}</h1>;
}
