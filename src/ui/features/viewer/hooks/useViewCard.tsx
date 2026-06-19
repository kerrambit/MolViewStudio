import { useEffect, useState } from "react";
import { Color } from "molstar/lib/mol-util/color";
import type { ViewCardProps } from "../components/scene-manager/view-card/ViewCard";
import {
    areCameraStatesEqual,
    getBackgroundColorChangeSubscription,
    getCanvasScreenshot,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type HexColor,
} from "../../../lib/molstar";
import { pushWarningNotification } from "../../../services/NotificationService";

export function useViewCard(props: ViewCardProps) {
    // State for the view title.
    const [currentName, setCurrentName] = useState<string | undefined>(
        props.metadata.title || "New view...",
    );

    // State for the view background color.
    const [currentBackgroundColor, setCurrentBackgroundColor] = useState<
        HexColor | undefined
    >(props.metadata.backgroundColor);

    // Camera hook.
    const cameraState = useLiveCameraState();

    // Subscribe to the change of background color.
    useEffect(() => {
        const sub = getBackgroundColorChangeSubscription((color) => {
            if (color) {
                const hex = Color.toHexStyle(color);
                setCurrentBackgroundColor((prev) =>
                    prev === hex ? prev : hex,
                );
            }
        });
        return () => sub?.unsubscribe();
    }, []);

    // Propagate async change of color to the parent.
    useEffect(() => {
        if (
            props.onBackgrounColorChange &&
            currentBackgroundColor &&
            currentBackgroundColor !== props.metadata.backgroundColor
        ) {
            props.onBackgrounColorChange(currentBackgroundColor);
        }
    }, [
        currentBackgroundColor,
        props.onBackgrounColorChange,
        props.metadata.backgroundColor,
    ]);

    // Compute whether the camera has moved relative to the saved reference view.
    const isCameraMoved = (() => {
        if (!cameraState || !props.metadata.referenceCamera) return false;

        const liveCameraReferenced = {
            ...cameraState,
            position: toMVSPosition({
                position: cameraState.position as any,
                target: cameraState.target as any,
                fov: cameraState.fov,
                mode: cameraState.mode,
            }),
        };

        return !areCameraStatesEqual(
            props.metadata.referenceCamera,
            liveCameraReferenced,
        );
    })();

    // Handler to title change.
    const handleTitleUpdate = (newName: string | undefined) => {
        setCurrentName(newName);
        props.onTitleChange?.(newName);
    };

    // Handler to capture camera.
    const handleCaptureCamera = async () => {
        if (!props.onCameraSave || !cameraState) return;

        let img: Base64Png | undefined;
        try {
            img = await getCanvasScreenshot();
        } catch {
            pushWarningNotification(
                "Application could not save the canvas screenshot! The current view will contain no screenshot.",
            );
            img = undefined;
        }

        props.onCameraSave(
            {
                ...cameraState,
                position: toMVSPosition({
                    position: cameraState.position as any,
                    target: cameraState.target as any,
                    fov: cameraState.fov,
                    mode: cameraState.mode,
                }),
            },
            img,
        );
    };

    return {
        currentName,
        currentBackgroundColor,
        cameraState,
        isCameraMoved,
        handleTitleUpdate,
        handleCaptureCamera,
    };
}
