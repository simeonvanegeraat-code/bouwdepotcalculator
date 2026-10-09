/**
 * Kleine parallelprojectie voor lijntekeningen en de statische poster.
 *
 * Geen bibliotheek: een architectonisch volume uit dozen en een zadeldak heeft
 * genoeg aan twee draaiingen en een schaal. tekening.js tekent hiermee de
 * lijntekeningen van de homepage in SVG.
 *
 * Assen: x naar rechts, y omhoog, z naar de kijker toe.
 */

const RAD = Math.PI / 180;

/** Geeft een functie die een punt [x,y,z] omzet naar [schermX, schermY, diepte]. */
export function camera(yawGraden, pitchGraden, schaal = 1) {
    const cy = Math.cos(yawGraden * RAD), sy = Math.sin(yawGraden * RAD);
    const cp = Math.cos(pitchGraden * RAD), sp = Math.sin(pitchGraden * RAD);
    return ([x, y, z]) => {
        const xr = x * cy - z * sy;
        const zr = x * sy + z * cy;
        return [xr * schaal, (zr * sp - y * cp) * schaal, zr * cp + y * sp];
    };
}

/** Een doos tussen twee hoekpunten: acht punten, twaalf randen, zes vlakken. */
export function doos(x0, y0, z0, x1, y1, z1) {
    const punten = [
        [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
        [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1],
    ];
    const randen = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const vlakken = [
        { p: [4, 5, 6, 7], n: [0, 1, 0] },
        { p: [3, 2, 6, 7], n: [0, 0, 1] },
        { p: [1, 2, 6, 5], n: [1, 0, 0] },
        { p: [0, 1, 5, 4], n: [0, 0, -1] },
        { p: [0, 3, 7, 4], n: [-1, 0, 0] },
    ];
    return { punten, randen, vlakken };
}

/** Een zadeldak met de nok langs de x-as. */
export function zadeldak(x0, x1, y0, yNok, z0, z1) {
    const zm = (z0 + z1) / 2;
    const punten = [
        [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
        [x0, yNok, zm], [x1, yNok, zm],
    ];
    const randen = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [0, 4], [3, 4], [1, 5], [2, 5]];
    const helling = Math.hypot(yNok - y0, zm - z0);
    const ny = (zm - z0) / helling, nz = (yNok - y0) / helling;
    const vlakken = [
        { p: [3, 2, 5, 4], n: [0, ny, nz] },
        { p: [0, 1, 5, 4], n: [0, ny, -nz] },
        { p: [1, 2, 5], n: [1, 0, 0] },
        { p: [0, 3, 4], n: [-1, 0, 0] },
    ];
    return { punten, randen, vlakken };
}
