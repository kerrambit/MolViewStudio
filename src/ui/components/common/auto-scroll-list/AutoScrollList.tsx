import { useEffect, useRef, type ReactNode } from "react";

type AutoScrollListProps<T> = {
    list: T[];
    activeIndex: number;
    renderItem: (item: T, index: number) => ReactNode;
};

export function AutoScrollList<T>(props: AutoScrollListProps<T>) {
    // References to elements in the list.
    const elementRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Handles the visual scroll reaction.
    useEffect(() => {
        if (
            props.activeIndex !== undefined &&
            props.activeIndex >= 0 &&
            elementRefs.current[props.activeIndex]
        ) {
            elementRefs.current[props.activeIndex]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [props.activeIndex]);

    // Render the component.
    return (
        <>
            {props.list.map((element, index) => {
                return (
                    <div
                        key={`scroll-item-${index}`}
                        ref={(el) => {
                            elementRefs.current[index] = el;
                        }}
                    >
                        {props.renderItem(element, index)}
                    </div>
                );
            })}
        </>
    );
}
