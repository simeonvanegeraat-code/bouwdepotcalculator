/**
 * De bouwplaats in 3D die meegroeit terwijl je de stappen op nieuwbouw.html
 * invult: een kavel met piketten, een torenkraan die uit de grond komt, en per
 * stap een deel dat op zijn plek wordt gehesen. Fundering, begane grond,
 * verdieping met steiger, dak. Aan het eind zakt de kraan weg, gaan de lampen
 * aan en rijdt de verhuiswagen voor.
 *
 * Dit is versiering bij het invullen; op het overzicht staat hij niet. De
 * pagina laadt dit bestand (en Three.js) pas als iemand de stappen opent, op
 * een breed scherm, met WebGL en zonder databesparing. Zie src/nieuwbouw/stappen.js.
 *
 * Eén getal stuurt alles: de voortgang s, van 0 (lege kavel) tot 5 (bewoond).
 * Elk onderdeel leest daar zijn eigen stukje uit. De camera draait mee.
 */

import {
    Scene, OrthographicCamera, WebGLRenderer, Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, ExtrudeGeometry, Shape,
    MeshStandardMaterial, HemisphereLight, DirectionalLight, PCFSoftShadowMap, Color,
} from 'three';

const KLEUR = { gras: 0xdde7e0, kavel: 0xeae6dc, beton: 0xcfcbc2, muur: 0xf4efe4, dak: 0x183b35, kraan: 0xcfad7d, staal: 0x26353b, raam: 0x9bb8a8, licht: 0xffd98a, boom: 0x5f8f7a, stam: 0x7a5c2e, wagen: 0xffffff };

const klem = (x) => Math.min(1, Math.max(0, x));
/** Welk deel van het stuk tussen a en b is voorbij, met een zachte start en landing. */
const fase = (s, a, b) => { const k = klem((s - a) / (b - a)); return k * k * (3 - 2 * k); };

export function maakBouwplaats(canvas) {
    // Op een telefoon is het beeld klein en telt de batterij: minder pixels en
    // een kleinere schaduwkaart, daar zie je het verschil niet.
    const klein = matchMedia('(max-width: 959px)').matches;
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, klein ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    const ZICHT = 13.2;

    scene.add(new HemisphereLight(0xffffff, 0xe9e2d2, 2.2));
    const zon = new DirectionalLight(0xfff1d6, 2.1);
    zon.castShadow = true;
    zon.shadow.mapSize.set(klein ? 1024 : 2048, klein ? 1024 : 2048);
    Object.assign(zon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
    zon.shadow.bias = -0.0005;
    scene.add(zon);

    const mat = (kleur, extra = {}) => new MeshStandardMaterial({ color: kleur, roughness: 0.85, metalness: 0, ...extra });
    const blok = (b, h, d, kleur, extra) => {
        const m = new Mesh(new BoxGeometry(b, h, d), mat(kleur, extra));
        m.castShadow = true; m.receiveShadow = true;
        return m;
    };

    /* --- grond en kavel --- */
    // Een ronde schijf: de rand van een rechthoek zou tegen de rand van het beeld lopen.
    const gras = new Mesh(new CylinderGeometry(7.4, 7.4, 0.2, 64), mat(KLEUR.gras)); gras.position.y = -0.1; gras.receiveShadow = true; scene.add(gras);
    const kavel = blok(8.5, 0.06, 6.5, KLEUR.kavel); kavel.position.y = 0.03; kavel.castShadow = false; scene.add(kavel);

    // Piketten met lint: zo ligt een kavel erbij voordat er gebouwd wordt.
    const piketten = new Group();
    for (const [x, z] of [[-4, -3], [4, -3], [4, 3], [-4, 3]]) {
        const p = blok(0.09, 0.7, 0.09, KLEUR.kraan); p.position.set(x, 0.35, z); piketten.add(p);
    }
    for (const [x, z, b, d] of [[0, -3, 8, 0.03], [0, 3, 8, 0.03], [-4, 0, 0.03, 6], [4, 0, 0.03, 6]]) {
        const lint = blok(b, 0.03, d, KLEUR.kraan); lint.position.set(x, 0.62, z); lint.castShadow = false; piketten.add(lint);
    }
    scene.add(piketten);

    /* --- het huis, in delen --- */
    const B = 4.4, D = 3.2, H = 1.35;
    const fundering = blok(B + 0.4, 0.3, D + 0.4, KLEUR.beton); scene.add(fundering);

    const delen = [];   // alles wat de kraan op zijn plek hijst: { mesh, y, van, tot }
    const hijs = (mesh, x, y, z, van, tot) => { mesh.position.set(x, y, z); scene.add(mesh); delen.push({ mesh, y, van, tot }); return mesh; };

    // Begane grond: vier wanden, een voor een.
    hijs(blok(B, H, 0.16, KLEUR.muur), 0, 0.3 + H / 2, -D / 2, 1.25, 1.55);
    hijs(blok(0.16, H, D, KLEUR.muur), -B / 2, 0.3 + H / 2, 0, 1.4, 1.7);
    hijs(blok(0.16, H, D, KLEUR.muur), B / 2, 0.3 + H / 2, 0, 1.55, 1.85);
    hijs(blok(B, H, 0.16, KLEUR.muur), 0, 0.3 + H / 2, D / 2, 1.7, 2.0);
    // Verdieping: vloer en de bovenbouw in één keer.
    hijs(blok(B + 0.1, 0.12, D + 0.1, KLEUR.beton), 0, 0.3 + H + 0.06, 0, 2.15, 2.45);
    hijs(blok(B, H, D, KLEUR.muur), 0, 0.3 + H + 0.12 + H / 2, 0, 2.4, 2.95);
    // Dak: een prisma over de hele diepte.
    const vorm = new Shape(); vorm.moveTo(-B / 2 - 0.3, 0); vorm.lineTo(B / 2 + 0.3, 0); vorm.lineTo(0, 1.5); vorm.closePath();
    const dak = new Mesh(new ExtrudeGeometry(vorm, { depth: D + 0.5, bevelEnabled: false }), mat(KLEUR.dak));
    dak.castShadow = true; dak.receiveShadow = true;
    const dakGroep = new Group(); dak.position.z = -(D + 0.5) / 2; dakGroep.add(dak);
    hijs(dakGroep, 0, 0.3 + 2 * H + 0.12, 0, 3.1, 3.75);

    // Ramen en deur aan de voorkant; ze gaan pas aan het eind branden.
    const glas = [];
    const raam = (x, y, b, h) => {
        const r = new Mesh(new BoxGeometry(b, h, 0.05), new MeshStandardMaterial({ color: KLEUR.raam, emissive: new Color(KLEUR.licht), emissiveIntensity: 0, roughness: 0.4 }));
        r.position.set(x, y, D / 2 + 0.09); scene.add(r); glas.push(r); return r;
    };
    raam(-1.2, 0.3 + H * 0.55, 1.1, 0.75); raam(1.35, 0.3 + H * 0.5, 0.6, 1.05);
    raam(-1.2, 0.3 + H * 1.65, 0.9, 0.7); raam(0.1, 0.3 + H * 1.65, 0.9, 0.7); raam(1.35, 0.3 + H * 1.65, 0.9, 0.7);

    // Steiger om de verdieping: staanders en liggers.
    const steiger = new Group();
    for (const x of [-B / 2 - 0.45, -0.8, 0.8, B / 2 + 0.45]) { const s = blok(0.06, 2 * H + 0.5, 0.06, KLEUR.staal); s.position.set(x, 0.3 + H + 0.1, D / 2 + 0.45); steiger.add(s); }
    for (const y of [0.3 + H * 0.9, 0.3 + H * 1.9]) { const l = blok(B + 1, 0.05, 0.3, KLEUR.kraan); l.position.set(0, y, D / 2 + 0.45); steiger.add(l); }
    scene.add(steiger);

    /* --- de kraan --- */
    const kraan = new Group();
    const mast = blok(0.32, 9, 0.32, KLEUR.kraan); mast.position.y = 4.5; kraan.add(mast);
    const voet = blok(1.5, 0.25, 1.5, KLEUR.staal); voet.position.y = 0.12; kraan.add(voet);
    const draai = new Group(); draai.position.y = 9; kraan.add(draai);
    const arm = blok(8.5, 0.22, 0.22, KLEUR.kraan); arm.position.x = 2.6; draai.add(arm);
    const gewicht = blok(1, 0.6, 0.6, KLEUR.staal); gewicht.position.set(-1.6, -0.2, 0); draai.add(gewicht);
    const cabine = blok(0.5, 0.5, 0.5, KLEUR.staal); cabine.position.set(0.35, -0.3, 0.3); draai.add(cabine);
    const kabel = blok(0.03, 1, 0.03, KLEUR.staal); kabel.castShadow = false; draai.add(kabel);
    const haak = blok(0.22, 0.18, 0.22, KLEUR.staal); draai.add(haak);
    kraan.position.set(-5.6, 0, -1.2);
    scene.add(kraan);

    /* --- wat er komt als het huis af is --- */
    const boom = (x, z, h) => {
        const g = new Group();
        const stam = new Mesh(new CylinderGeometry(0.08, 0.1, h * 0.4, 8), mat(KLEUR.stam)); stam.position.y = h * 0.2; stam.castShadow = true; g.add(stam);
        const kruin = new Mesh(new ConeGeometry(h * 0.32, h * 0.8, 10), mat(KLEUR.boom)); kruin.position.y = h * 0.75; kruin.castShadow = true; g.add(kruin);
        g.position.set(x, 0, z); scene.add(g); return g;
    };
    const bomen = [boom(3.6, -2.2, 2.2), boom(-3.3, 2.3, 1.5), boom(4.9, 1.2, 1.8)];

    const wagen = new Group();
    const bak = blok(1.9, 1.1, 1, KLEUR.wagen); bak.position.set(-0.3, 0.8, 0); wagen.add(bak);
    const neus = blok(0.8, 0.8, 1, KLEUR.dak); neus.position.set(1.05, 0.65, 0); wagen.add(neus);
    for (const x of [-0.9, 0.9]) for (const z of [-0.5, 0.5]) {
        const w = new Mesh(new CylinderGeometry(0.22, 0.22, 0.14, 14), mat(KLEUR.staal)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.22, z); wagen.add(w);
    }
    wagen.position.z = 4.1; scene.add(wagen);

    /* --- de stand toepassen --- */
    let s = 0, doel = 0, zonFractie = 0.35, loopt = false, vorige = 0;
    // Op het startscherm, als er nog niets gebouwd is, draait de kavel langzaam
    // rond. `rondje` is de hoek die daardoor bij de vaste kijkhoek komt.
    let draait = false, rondje = 0;
    const RONDJE = Math.PI * 2;

    function pasToe(tijd) {
        piketten.visible = s < 1.3;
        piketten.scale.y = 1 - fase(s, 0.9, 1.3) * 0.999;

        // Fundering: gestort, van niets tot volle hoogte.
        const f = fase(s, 0.25, 1.0);
        fundering.visible = f > 0.001;
        fundering.scale.y = Math.max(0.001, f);
        fundering.position.y = 0.15 * f;

        // De delen die de kraan brengt, en welk deel nu aan de haak hangt.
        let aanDeHaak = null;
        for (const d of delen) {
            const k = fase(s, d.van, d.tot);
            d.mesh.visible = k > 0.001;
            d.mesh.position.y = d.y + (1 - k) * 4.2;
            if (k > 0.001 && k < 0.999) aanDeHaak = d;
        }

        // De kraan wordt opgebouwd vanaf zijn voet en staat er bij de eerste vraag
        // helemaal. Van onderaf omhoogschuiven kan niet: in dit aanzicht zie je
        // hem dan onder het gras hangen.
        const op = fase(s, 0.3, 0.95), weg = fase(s, 4.15, 4.7);
        kraan.visible = op > 0.001 && weg < 0.999;
        kraan.scale.y = Math.max(0.001, op * (1 - weg));
        const rust = 0.35 + Math.sin(tijd / 2600) * 0.06;
        draai.rotation.y = aanDeHaak ? -0.25 - (aanDeHaak.van - 1.25) * 0.12 : rust;
        const haakY = aanDeHaak ? aanDeHaak.mesh.position.y + 1.4 - 9 : -1.2;
        haak.position.set(5.4, haakY, 0);
        kabel.scale.y = Math.max(0.05, -haakY);
        kabel.position.set(5.4, haakY / 2, 0);

        const st = fase(s, 2.0, 2.35) * (1 - fase(s, 3.75, 4.1));
        steiger.visible = st > 0.001;
        steiger.scale.y = Math.max(0.001, st);

        const ramen = fase(s, 3.7, 4.05), aan = fase(s, 4.5, 5);
        for (const r of glas) { r.visible = ramen > 0.001; r.scale.setScalar(Math.max(0.001, ramen)); r.material.emissiveIntensity = aan * 1.1; }

        bomen.forEach((b, i) => { const k = fase(s, 4.2 + i * 0.12, 4.6 + i * 0.12); b.visible = k > 0.001; b.scale.setScalar(Math.max(0.001, k)); });
        const rit = fase(s, 4.35, 5);
        wagen.visible = rit > 0.001;
        wagen.position.x = 7 - rit * 5.4;

        // De zon: van ochtend naar avond met de bouwduur; aan het eind wordt het avond.
        const hoek = (0.15 + zonFractie * 0.7) * Math.PI;
        zon.position.set(Math.cos(hoek) * 14, 6 + Math.sin(hoek) * 9, 8);
        zon.intensity = 2.1 - aan * 1.1;

        // De camera draait een kwart rond terwijl het huis groeit.
        const az = 0.62 + s * 0.16 + rondje, afstand = 30;
        camera.position.set(Math.sin(az) * afstand, 19, Math.cos(az) * afstand);
        // Bij het ronddraaien op het startscherm kijkt de camera naar het midden van
        // de kavel, anders zwaait het gras heen en weer; daarna schuift hij op voor de kraan.
        camera.lookAt(-0.9 * fase(s, 0.2, 1.0), 3.5, 0);
        // Op een telefoon is het beeld een lage band. Zolang de kraan er niet staat
        // hoeft die er niet in te passen en mag de kavel groter in beeld.
        if (klein) { camera.zoom = 1 + 0.35 * (1 - fase(s, 0.2, 0.95)); camera.updateProjectionMatrix(); }
    }

    function teken(tijd) {
        // Buiten beeld (weggescrold, of het toetsenbord staat ervoor) tekenen we niet.
        if (!inBeeld) { loopt = false; return; }
        const dt = Math.min(0.05, (tijd - vorige) / 1000 || 0.016);
        vorige = tijd;
        // Rustig naar het doel: ongeveer één eenheid per seconde, zodat elk deel te volgen is.
        const verschil = doel - s;
        s = Math.abs(verschil) < 0.002 ? doel : s + Math.sign(verschil) * Math.min(Math.abs(verschil), dt * 0.85);
        if (draait && !stil) {
            rondje = (rondje + dt * 0.14) % RONDJE;   // een rondje in driekwart minuut
        } else if (rondje !== 0) {
            // Zodra het bouwen begint: langs de kortste kant terug naar de vaste hoek.
            const naar = rondje > Math.PI ? RONDJE : 0;
            rondje = Math.abs(naar - rondje) < 0.004 ? 0 : rondje + (naar - rondje) * Math.min(1, dt * 3.5);
        }
        pasToe(tijd);
        renderer.render(scene, camera);
        // Doortekenen zolang er iets beweegt, of zolang de kraan er staat en zacht meedeint.
        if (s !== doel || rondje !== 0 || ((kraan.visible || draait) && !stil)) requestAnimationFrame(teken);
        else loopt = false;
    }
    const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let inBeeld = true;
    const wek = () => { if (!loopt && inBeeld) { loopt = true; vorige = performance.now(); requestAnimationFrame(teken); } };

    function pasMaat() {
        // De schaal volgt het vak eromheen; het doek zelf mag groter zijn dan dat
        // vak (zie nieuwbouw.css), zodat de arm van de kraan en de rand van het
        // gras niet tegen een rand afgesneden worden.
        const { clientWidth: b, clientHeight: h } = canvas.parentElement;
        const { clientWidth: db, clientHeight: dh } = canvas;
        if (!b || !h || !db || !dh) return;
        renderer.setSize(db, dh, false);
        // De breedte van het gras moet passen, en in de hoogte de kraan (19 eenheden).
        const perPixel = Math.max(ZICHT / h, 15.5 / b, 19 / dh);
        camera.top = (dh * perPixel) / 2; camera.bottom = -camera.top;
        camera.right = (db * perPixel) / 2; camera.left = -camera.right;
        camera.updateProjectionMatrix();
        wek();
    }
    new ResizeObserver(pasMaat).observe(canvas.parentElement);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([item]) => { inBeeld = item.isIntersecting; if (inBeeld) wek(); }).observe(canvas.parentElement);
    }
    pasMaat();

    return {
        /** @param {number} waarde 0 (lege kavel) tot 5 (bewoond)  @param {boolean} [direct] zonder beweging */
        zetVoortgang(waarde, direct = false) { doel = waarde; draait = waarde < 0.5; if (direct || stil) s = waarde; wek(); },
        /** De stand van de zon, 0 (ochtend) tot 1 (avond). */
        zetZon(fractie) { zonFractie = klem(fractie); wek(); },
    };
}
