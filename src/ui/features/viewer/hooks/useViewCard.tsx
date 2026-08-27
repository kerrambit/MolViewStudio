import { useEffect, useState } from "react";
import { Color } from "molstar/lib/mol-util/color";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import type { ViewCardProps } from "../components/scene-manager/view-card/ViewCard";
import {
    areCameraStatesEqual,
    getBackgroundColorChangeSubscription,
    getCanvasScreenshot,
    toMVSPosition,
    useLiveCameraState,
    type Base64Png,
    type HexColor,
    isMolstarReloading,
} from "../../../lib/molstar";
import { pushWarningNotification } from "../../../services/NotificationService";

export function useViewCard(props: ViewCardProps) {
    // Deconstruct the props.
    const { onBackgrounColorChange, metadata } = props;
    const { backgroundColor } = metadata;

    // Local display state for the view title.
    const [currentName, setCurrentName] = useState<string>(
        props.metadata.title || "",
    );

    // Local display state for the background color.
    const [currentBackgroundColor, setCurrentBackgroundColor] = useState<
        HexColor | undefined
    >(backgroundColor);

    // Camera hook.
    const cameraState = useLiveCameraState();

    // Keep local state in sync when change is propagated with undo/redo.
    useEffect(() => {
        setCurrentBackgroundColor(backgroundColor);
    }, [backgroundColor]);

    useEffect(() => {
        setCurrentName(metadata.title || "");
    }, [metadata.title]);

    // Molstar's own in-canvas UI changed the color.
    // This is an explicit, one-shot reaction to a live event — not an effect that infers change by diffing state - so it can't loop.
    useEffect(() => {
        const sub = getBackgroundColorChangeSubscription((color) => {
            if (isMolstarReloading() || color === undefined || color === null) {
                return;
            }
            const hex = Color.toHexStyle(color);

            setCurrentBackgroundColor((prev) => (prev === hex ? prev : hex));

            if (hex !== backgroundColor) {
                onBackgrounColorChange?.(hex);
            }
        });
        return () => sub?.unsubscribe();
    }, [backgroundColor, onBackgrounColorChange]);

    // Compute whether the camera has moved relative to the saved reference view.
    const isCameraMoved = (() => {
        if (!cameraState || !metadata.referenceCamera) return false;

        const liveCameraReferenced = {
            ...cameraState,
            position: toMVSPosition({
                position: cameraState.position as Vec3,
                target: cameraState.target as Vec3,
                fov: cameraState.fov,
                mode: cameraState.mode,
            }),
        };

        return !areCameraStatesEqual(
            metadata.referenceCamera,
            liveCameraReferenced,
        );
    })();

    // Handler to title change.
    const handleTitleUpdate = (
        newName: string | undefined,
        propagateChangeUp: boolean,
    ) => {
        setCurrentName(newName || "");

        if (!propagateChangeUp) return;

        const normalizedNew = newName || undefined;
        const normalizedOld = metadata.title || undefined;

        if (normalizedNew !== normalizedOld) {
            props.onTitleChange?.(newName);
        }
    };
    // Handler to capture camera.
    const handleCaptureCamera = async () => {
        if (!props.onCameraSave || !cameraState) return;

        let img: Base64Png | undefined;
        try {
            img = await getCanvasScreenshot();
        } catch {
            pushWarningNotification(
                "Application could not save the canvas screenshot! The current view will contain no screenshot. Undo this action if needed.",
            );
            img = undefined;
        }

        props.onCameraSave(
            {
                ...cameraState,
                position: toMVSPosition({
                    position: cameraState.position as Vec3,
                    target: cameraState.target as Vec3,
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
