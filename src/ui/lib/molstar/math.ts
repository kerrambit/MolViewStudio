/**
 * Converts Euler angles (in degrees) to a flat 9-element row-major 3x3 rotation matrix.
 * Uses standard ZYX order for 3D graphics.
 */
export function getRotationMatrix3x3(
    pitchDeg: number,
    yawDeg: number,
    rollDeg: number,
): number[] {
    const d2r = Math.PI / 180;
    const cx = Math.cos(pitchDeg * d2r),
        sx = Math.sin(pitchDeg * d2r);
    const cy = Math.cos(yawDeg * d2r),
        sy = Math.sin(yawDeg * d2r);
    const cz = Math.cos(rollDeg * d2r),
        sz = Math.sin(rollDeg * d2r);

    return [
        cy * cz,
        cz * sx * sy - cx * sz,
        cx * cz * sy + sx * sz,
        cy * sz,
        cx * cz + sx * sy * sz,
        cx * sy * sz - cz * sx,
        -sy,
        cy * sx,
        cx * cy,
    ];
}

/**
 * Converts a flat 9-element 3x3 rotation matrix back to Euler angles (Pitch, Yaw, Roll) in degrees.
 */
export function getEulerAnglesFromMatrix3x3(
    matrix: number[],
): [number, number, number] {
    if (!matrix || matrix.length !== 9) return [0, 0, 0];

    const m00 = matrix[0],
        m01 = matrix[1];
    const m10 = matrix[3],
        m11 = matrix[4];
    const m20 = matrix[6],
        m21 = matrix[7],
        m22 = matrix[8];

    let pitchRad = 0,
        yawRad = 0,
        rollRad = 0;
    const sy = -m20;

    if (Math.abs(sy) < 0.99999) {
        pitchRad = Math.atan2(m21, m22);
        yawRad = Math.asin(sy);
        rollRad = Math.atan2(m10, m00);
    } else {
        pitchRad = 0;
        yawRad = sy > 0 ? Math.PI / 2 : -Math.PI / 2;
        rollRad = Math.atan2(-m01, m11);
    }

    const r2d = 180 / Math.PI;
    return [
        Math.round(pitchRad * r2d * 10) / 10,
        Math.round(yawRad * r2d * 10) / 10,
        Math.round(rollRad * r2d * 10) / 10,
    ];
}
