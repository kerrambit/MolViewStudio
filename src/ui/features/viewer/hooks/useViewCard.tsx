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
} from "../../../lib/molstar";
import { pushWarningNotification } from "../../../services/NotificationService";

export function useViewCard(props: ViewCardProps) {
    // State for the view title.
    const [currentName, setCurrentName] = useState<string | undefined>(
        props.metadata.title,
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
    const { onBackgrounColorChange, metadata } = props;
    const { backgroundColor } = metadata;
    useEffect(() => {
        if (
            onBackgrounColorChange &&
            currentBackgroundColor &&
            currentBackgroundColor !== backgroundColor
        ) {
            onBackgrounColorChange(currentBackgroundColor);
        }
    }, [currentBackgroundColor, onBackgrounColorChange, backgroundColor]);

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
