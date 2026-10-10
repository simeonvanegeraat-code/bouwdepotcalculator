/**
 * Het 3D-huis naast de leenruimtecheck: een woonhuis dat in bouwlagen
 * terugkomt terwijl de bezoeker scrolt. Overgenomen uit homepageconcept A
 * (prototypes/homepage/a-scene.js).
 *
 * Staat in een eigen bestand zodat Three.js alleen wordt opgehaald wanneer
 * huis.js heeft vastgesteld dat de scene getoond mag worden: breed scherm,
 * WebGL, geen verminderde beweging, en de tekening bijna in beeld.
 *
 * Opzet: een orthografische camera (de axonometrie van een bouwtekening), zes
 * lagen die elk op een eigen moment in het verhaal op hun plek zakken, en één
 * lichtbron met zachte schaduw. Lagen die nog niet gebouwd zijn zweven
 * doorschijnend boven het huis.
 */

// Bij naam, zodat de bundel alleen meeneemt wat de scene gebruikt.
import { BoxGeometry, DirectionalLight, ExtrudeGeometry, Group, HemisphereLight, Mesh, MeshStandardMaterial, OrthographicCamera, PCFShadowMap, PCFSoftShadowMap, PlaneGeometry, Scene, ShadowMaterial, Shape, WebGLRenderer } from 'three';

const KLEUR = {
    kavel: 0xcbd8cf,
    fundering: 0xbdb7aa,
    wand: 0xf4f0e7,
    wandBoven: 0xeee9de,
    dak: 0x1d463f,
    glas: 0x26353b,
    licht: 0xf1cf9a,
};

const zacht = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

function materiaal(kleur) {
    return new MeshStandardMaterial({ color: kleur, roughness: 0.92, metalness: 0, transparent: true });
}

function blok(b, h, d, kleur) {
    const mesh = new Mesh(new BoxGeometry(b, h, d), materiaal(kleur));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function zadeldak() {
    const vorm = new Shape();
    vorm.moveTo(-2.55, 0);
    vorm.lineTo(2.55, 0);
    vorm.lineTo(0, 1.7);
    vorm.closePath();
    const geo = new ExtrudeGeometry(vorm, { depth: 6.4, bevelEnabled: false });
    geo.translate(0, 0, -3.2);
    geo.rotateY(Math.PI / 2);
    const mesh = new Mesh(geo, materiaal(KLEUR.dak));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

/** Ramen en deur als dunne platen op de voor- en zijgevel. */
function afbouw() {
    const groep = new Group();
    const glas = new MeshStandardMaterial({
        color: KLEUR.glas, roughness: 0.35, transparent: true,
        emissive: KLEUR.licht, emissiveIntensity: 0,
    });
    const voor = [[-1.9, 0.925, 0.8, 1.25], [0.75, 1.125, 2.9, 0.75], [-1.45, 2.5, 1.7, 0.7], [1.4, 2.5, 1.6, 0.7]];
    for (const [x, y, b, h] of voor) {
        const m = new Mesh(new BoxGeometry(b, h, 0.06), glas);
        m.position.set(x, y, 2.31);
        groep.add(m);
    }
    const zij = [[-0.1, 1.125, 2.6, 0.75], [0, 2.5, 1.2, 0.7]];
    for (const [z, y, b, h] of zij) {
        const m = new Mesh(new BoxGeometry(0.06, h, b), glas);
        m.position.set(3.01, y, z);
        groep.add(m);
    }
    groep.userData.glas = glas;
    return groep;
}

export function maakScene(canvas, toneel) {
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap ?? PCFShadowMap;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const KIJKHOOGTE = 10;

    scene.add(new HemisphereLight(0xffffff, 0xefe8da, 2.3));
    const zon = new DirectionalLight(0xfff3df, 1.9);
    zon.position.set(-5, 12, 9);
    zon.castShadow = true;
    zon.shadow.mapSize.set(2048, 2048);
    Object.assign(zon.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
    zon.shadow.bias = -0.0004;
    zon.shadow.normalBias = 0.03;
    scene.add(zon);

    // Vangt de schaduw buiten de kavel op, zodat het huis op de pagina staat en
    // niet op een plaatje.
    const grond = new Mesh(new PlaneGeometry(60, 60), new ShadowMaterial({ opacity: 0.12 }));
    grond.rotation.x = -Math.PI / 2;
    grond.position.y = -0.15;
    grond.receiveShadow = true;
    scene.add(grond);

    const huis = new Group();
    scene.add(huis);

    // `klaar` is het punt in het verhaal waarop de laag op zijn plek ligt.
    const lagen = [
        { mesh: blok(9.2, 0.14, 7.6, KLEUR.kavel), y: -0.07, klaar: -1 },
        { mesh: blok(6.3, 0.3, 4.9, KLEUR.fundering), y: 0.15, klaar: 0.9 },
        { mesh: blok(6, 1.5, 4.6, KLEUR.wand), y: 1.05, klaar: 1.55 },
        { mesh: blok(6, 1.4, 4.6, KLEUR.wandBoven), y: 2.5, klaar: 2.0 },
        { mesh: zadeldak(), y: 3.2, klaar: 2.65 },
        { mesh: afbouw(), y: 0, klaar: 3.0 },
    ];
    for (const laag of lagen) {
        laag.mesh.position.y = laag.y;
        huis.add(laag.mesh);
    }
    const glas = lagen[5].mesh.userData.glas;

    function zetLaag(laag, index, s) {
        const los = zacht(0, 0.5, s);                               // lagen komen los van elkaar
        const geland = laag.klaar < 0 ? 1 : zacht(laag.klaar - 0.45, laag.klaar, s);
        const zweef = los * (1 - geland);
        laag.mesh.position.y = laag.y + zweef * (1.5 + index * 0.6);
        const dekking = 1 - zweef * 0.84;
        laag.mesh.traverse((deel) => {
            if (!deel.isMesh) return;
            deel.material.opacity = dekking;
            deel.castShadow = dekking > 0.6 && deel.material !== glas;
        });
    }

    let doel = 0;
    let nu = 0;
    let muisX = 0, muisY = 0, kijkX = 0, kijkY = 0;
    let loopt = false;

    function teken() {
        nu += (doel - nu) * 0.1;
        kijkX += (muisX - kijkX) * 0.06;
        kijkY += (muisY - kijkY) * 0.06;

        lagen.forEach((laag, i) => zetLaag(laag, i, nu));
        glas.emissiveIntensity = zacht(3.45, 4, nu) * 1.1;

        // Het huis draait langzaam mee: aan het eind staat de voorgevel bijna recht naar de lezer.
        huis.rotation.y = nu * 0.11 + kijkX * 0.12;

        const los = zacht(0, 0.6, nu) * (1 - zacht(2.6, 3.4, nu));
        camera.zoom = 1 - los * 0.24;
        camera.position.set(11.5, 10 + kijkY * 0.8, 16.4);
        camera.lookAt(0, 2.1 + los * 1.9, 0);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);

        const rust = Math.abs(doel - nu) < 0.0005 && Math.abs(muisX - kijkX) < 0.0005 && Math.abs(muisY - kijkY) < 0.0005;
        if (rust) { loopt = false; return; }
        requestAnimationFrame(teken);
    }

    // Alleen tekenen als er iets verandert; een stilstaand huis kost dan niets.
    function wek() {
        if (loopt) return;
        loopt = true;
        requestAnimationFrame(teken);
    }

    function pasMaat() {
        const { clientWidth: b, clientHeight: h } = canvas.parentElement;
        if (!b || !h) return;
        renderer.setSize(b, h, false);
        const verhouding = b / h;
        // Smal toneel: uitzoomen tot de kavel past.
        const hoogte = Math.max(KIJKHOOGTE, 13.5 / verhouding);
        camera.top = hoogte / 2;
        camera.bottom = -hoogte / 2;
        camera.left = (-hoogte * verhouding) / 2;
        camera.right = (hoogte * verhouding) / 2;
        wek();
    }
    new ResizeObserver(pasMaat).observe(canvas.parentElement);
    pasMaat();

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
        toneel.addEventListener('pointermove', (e) => {
            const r = toneel.getBoundingClientRect();
            muisX = (e.clientX - r.left) / r.width - 0.5;
            muisY = (e.clientY - r.top) / r.height - 0.5;
            wek();
        });
        toneel.addEventListener('pointerleave', () => { muisX = 0; muisY = 0; wek(); });
    }

    return {
        zetVoortgang(s, direct = false) {
            doel = s;
            if (direct) nu = s;
            wek();
        },
    };
}
