import { useLocation } from "react-router-dom";

interface RouterBreadcrumbsProps {
    wordsToFix?: { words: { word: string; fixed: string }[] };
}

export function RouterBreadcrumbs({ wordsToFix }: RouterBreadcrumbsProps) {
    const location = useLocation();

    const pathParts = location.pathname
        .split("/")
        .filter(Boolean)
        .map((part) => {
            const match = wordsToFix?.words.find(
                (w) => w.word.toLowerCase() === part.toLowerCase()
            );
            if (match) return match.fixed;
            return part.charAt(0).toUpperCase() + part.slice(1);
        });

    return <h1 style={{ marginBottom: "0" }}>{pathParts.join(" – ")}</h1>;
}
