import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d";
import { getMolstar } from "./instance";
import { type CameraState } from "./types";
import { useEffect, useState } from "react";

/**
 * Retrieves current camera state.
 * @returns current camera state or undefined if camera is not available
 */
export function getCameraState(): CameraState | undefined {
    const molstar = getMolstar();

    if (!molstar.canvas3d) {
        return undefined;
    }

    const cameraSnapshot = molstar.canvas3d.camera.getSnapshot();
    return {
        mode: cameraSnapshot.mode,
        target: Vec3.clone(molstar.canvas3d.camera.target),
        position: Vec3.clone(molstar.canvas3d.camera.position),
        up: Vec3.clone(molstar.canvas3d.camera.up),
        fov: cameraSnapshot.fov,
    };
}

/**
 * Sets the camera.
 * @param cameraState camera state to set the camera
 */
export function setCameraState(cameraState: CameraState) {
    const molstar = getMolstar();

    const { mode, position, up, target, fov } = cameraState;

    molstar.canvas3d?.camera.setState({
        mode: mode,
        target: Vec3.create(target[0], target[1], target[2]),
        position: Vec3.create(position[0], position[1], position[2]),
        up: Vec3.create(up[0], up[1], up[2]),
        fov: fov,
    });
}

/**
 * Retrieves default camera state.
 * @returns default camera
 */
export function getDefaultCameraState(): CameraState {
    return {
        mode: "perspective",
        position: Vec3.create(0, 0, 100),
        up: Vec3.create(0, 1, 0),
        target: Vec3.create(0, 0, 0),
        fov: 0.7853981633974483,
    };
}

/**
 * Compares two `CameraState` objects for their equality.
 * @param a first object
 * @param b second object
 * @param epsilon tolerance threshold for floating numbers comparison
 * @returns true if they are "close enough" equal, otherwise false
 */
export function areCameraStatesEqual(
    a: CameraState | undefined,
    b: CameraState | undefined,
    epsilon: number = 0.1,
): boolean {
    if (!a || !b) return a === b;
    if (!a.position || !b.position) return false;
    if (!a.target || !b.target) return false;
    if (!a.up || !b.up) return false;

    return (
        Vec3.distance(
            Vec3.create(a.position[0], a.position[1], a.position[2]),
            Vec3.create(b.position[0], b.position[1], b.position[2]),
        ) < epsilon &&
        Vec3.distance(
            Vec3.create(a.target[0], a.target[1], a.target[2]),
            Vec3.create(b.target[0], b.target[1], b.target[2]),
        ) < epsilon &&
        Vec3.distance(
            Vec3.create(a.up[0], a.up[1], a.up[2]),
            Vec3.create(b.up[0], b.up[1], b.up[2]),
        ) < epsilon
    );
}

/**
 * Hook for current camera state.
 * @returns current camera state or undefined if camera is not available
 */
export function useLiveCameraState(): CameraState | undefined {
    const [liveCameraState, setLiveCameraState] = useState<
        CameraState | undefined
    >(undefined);

    useEffect(() => {
        let handle: number;

        const update = () => {
            const current = getCameraState();
            setLiveCameraState((prev) =>
                areCameraStatesEqual(prev, current) ? prev : current,
            );
            handle = requestAnimationFrame(update);
        };

        handle = requestAnimationFrame(update);
        return () => cancelAnimationFrame(handle);
    }, []);

    return liveCameraState;
}

/**
 * Convert a real Molstar camera position to an MVS reference-camera position.
 *
 * MVS camera positions are defined assuming a fixed reference FOV:
 *  - Perspective: 60°
 *  - Orthographic: ~53°
 *
 * This function removes the effect of the real camera FOV so that
 * the stored position is FOV-independent.
 *
 * @param position position
 * @param target target
 * @param fov field of view in radians
 * @param mode camera mode
 * @returns adjusted camera position
 */
export function toMVSPosition(camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
    mode: "perspective" | "orthographic";
}): Vec3 {
    const delta = Vec3.sub(Vec3(), camera.position, camera.target);

    const scaleRealToRef =
        camera.mode === "orthographic"
            ? Math.tan(camera.fov / 2) / 0.5
            : Math.sin(camera.fov / 2) / 0.5;

    return Vec3.scaleAndAdd(Vec3(), camera.target, delta, scaleRealToRef);
}

/**
 * Convert an MVS reference-camera position to a real Mol* camera position
 * for the currently active camera FOV.
 *
 * @param mvsPosition position from MVS
 * @param mvsTarget target from MVS
 * @param fovRad current field of view in radians
 * @param mode current camera mode
 * @returns real Molstar camera position
 */
export function fromMVSPosition(
    mvsPosition: Vec3,
    mvsTarget: Vec3,
    fovRad: number,
    mode: "perspective" | "orthographic",
): Vec3 {
    const delta = Vec3.sub(Vec3(), mvsPosition, mvsTarget);

    const scaleRefToReal =
        mode === "orthographic"
            ? 0.5 / Math.tan(fovRad / 2)
            : 0.5 / Math.sin(fovRad / 2);

    return Vec3.scaleAndAdd(Vec3(), mvsTarget, delta, scaleRefToReal);
}
