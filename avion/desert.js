// 1. Initialisation (inchangé)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Lumière (ajustée pour un éclairage plus naturel)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, -1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 3. Variables (inchangé)
let airplane;
const maxRollAngle = THREE.MathUtils.degToRad(35);

// 4. Système audio (inchangé)
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Sons directionnels (inchangé)
const soundLoader = new THREE.AudioLoader();
const sounds = {
    left: new THREE.PositionalAudio(audioListener),
    right: new THREE.PositionalAudio(audioListener),
    up: new THREE.PositionalAudio(audioListener),
    down: new THREE.PositionalAudio(audioListener),
    engine: new THREE.PositionalAudio(audioListener)
};

// Chargement des sons (inchangé)
soundLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/prop-plane-14513.mp3', (buffer) => {
    sounds.left.setBuffer(buffer);
    sounds.left.setRefDistance(20);
});

soundLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/prop-plane-14513.mp3', (buffer) => {
    sounds.right.setBuffer(buffer);
    sounds.right.setRefDistance(20);
});

soundLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/small-plane-passing-by-264944.mp3', (buffer) => {
    sounds.up.setBuffer(buffer);
    sounds.up.setRefDistance(20);
});

soundLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/prop-plane-14513.mp3', (buffer) => {
    sounds.down.setBuffer(buffer);
    sounds.down.setRefDistance(20);
});

soundLoader.load('https://assets.codepen.io/21542/engine-loop.mp3', (buffer) => {
    sounds.engine.setBuffer(buffer);
    sounds.engine.setLoop(true);
    sounds.engine.setRefDistance(50);
    sounds.engine.play();
});

// 5. Chargement du modèle 3D (inchangé)
const loader = new THREE.GLTFLoader();
loader.load(
    'https://raw.githubusercontent.com/berru-g/plane/main/avion/cessna172.glb',
    (gltf) => {
        airplane = gltf.scene;
        airplane.scale.set(14, 14, 14);
        airplane.rotation.set(Math.PI, Math.PI, 0);

        airplane.add(sounds.left);
        airplane.add(sounds.right);
        airplane.add(sounds.up);
        airplane.add(sounds.down);
        airplane.add(sounds.engine);

        scene.add(airplane);
        document.getElementById('loading').style.display = 'none';
    },
    undefined,
    (error) => {
        console.error(error);
        createFallbackAirplane();
    }
);

function createFallbackAirplane() {
    airplane = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.3, 3, 8),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    body.rotation.z = Math.PI / 2;
    airplane.add(body);

    const wing = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 1.5),
        new THREE.MeshPhongMaterial({ color: 0xcccccc })
    );
    wing.position.y = -0.2;
    airplane.add(wing);

    scene.add(airplane);
    resetPosition();
}

function resetPosition() {
    if (airplane) {
        airplane.position.set(0, 100, 0);
        airplane.rotation.set(0, Math.PI, 0);
    }
    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);
}

// 6. Nouvel Environnement

// Ciel réaliste avec texture HD
const skyTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/berru-g/plane/refs/heads/main/avion/sunrise.jpg');
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
skyTexture.encoding = THREE.sRGBEncoding;
//https://cdn.polyhaven.com/asset_img/primary/cape_hill.png?height=760
//https://polyhaven.com/a/industrial_sunset_02_puresky
//https://cdn.polyhaven.com/asset_img/primary/rogland_clear_night.png?height=760

const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide
});
const skyGeometry = new THREE.SphereGeometry(10000, 320, 320);//=map
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

scene.background = null; // Désactive tout fond coloré
scene.fog = new THREE.FogExp2(0x87CEEB, 0.0002);

// Nuages volumineux et réalistes
const cloudGeometry = new THREE.BufferGeometry();
const cloudCount = 100;
const cloudPositions = [];
const cloudSizes = [];

for (let i = 0; i < cloudCount; i++) {
    // Position aléatoire dans le ciel
    cloudPositions.push(
        Math.random() * 4000 - 2000,
        Math.random() * 800 + 200,
        Math.random() * 4000 - 2000
    );
    // Taille aléatoire
    cloudSizes.push(Math.random() * 50 + 20);
}

cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cloudPositions, 3));
cloudGeometry.setAttribute('size', new THREE.Float32BufferAttribute(cloudSizes, 1));

const cloudTexture = new THREE.TextureLoader().load('#');
const cloudMaterial = new THREE.PointsMaterial({
    map: cloudTexture,
    size: 1,
    transparent: true,
    opacity: 0.8,
    depthTest: false
});

const clouds = new THREE.Points(cloudGeometry, cloudMaterial);
scene.add(clouds);

// Animation des nuages
function animateClouds() {
    const positions = cloudGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += 0.1; // Déplacement horizontal
        if (positions[i] > 2000) positions[i] = -2000;
    }
    cloudGeometry.attributes.position.needsUpdate = true;
}

// Génération procédurale avancée du terrain
function generateProceduralTerrain() {
    const terrainSize = 10000;
    const terrainSegments = 200;
    
    // Création de la géométrie
    const terrainGeometry = new THREE.PlaneGeometry(
        terrainSize, terrainSize, terrainSegments, terrainSegments
    );
    terrainGeometry.rotateX(-Math.PI / 2);
    
    // Génération du bruit pour le terrain
    const noise = new SimplexNoise();
    const vertices = terrainGeometry.attributes.position;
    
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ(i);
        
        // Bruit multi-couche pour un terrain plus naturel
        let y = 0;
        y += noise.noise2D(x * 0.001, z * 0.001) * 100; // Grandes montagnes
        y += noise.noise2D(x * 0.005, z * 0.005) * 40;  // Collines moyennes
        y += noise.noise2D(x * 0.01, z * 0.01) * 10;    // Petites variations
        
        // Ajout de plaines plates
        if (y < 20) y = y * 0.3;
        
        vertices.setY(i, y);
    }
    
    terrainGeometry.computeVertexNormals();
    
    // Textures du terrain
    const grassTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/dev/examples/textures/terrain/grasslight-big.jpg');
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(terrainSize / 100, terrainSize / 100);
    //grassTexture.repeat.set(30, 30);

    const rockTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/master/examples/textures/noises/perlin/128x128.png');
    rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
    rockTexture.repeat.set(terrainSize / 100, terrainSize / 100);
    //rockTexture.repeat.set(30, 30);
    // Matériau avec mélange de textures selon l'altitude
    const terrainMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        wireframe: false,
        flatShading: false,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 1.0
    });
    
    // Ajout des couleurs en fonction de l'altitude
    const colors = [];
    for (let i = 0; i < vertices.count; i++) {
        const y = vertices.getY(i);
        
        // Couleur de base (herbe)
        let color = new THREE.Color(0x3a5f0b);
        
        // Roche pour les hautes altitudes
        if (y > 60) {
            color.lerp(new THREE.Color(0x7a7a7a), THREE.MathUtils.smoothstep(60, 100, y));
        }
        // Sable pour les basses altitudes
        else if (y < 10) {
            color.lerp(new THREE.Color(0xc2b280), THREE.MathUtils.smoothstep(10, 0, y));
        }
        
        colors.push(color.r, color.g, color.b);
    }
    
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -50;
    scene.add(terrain);
    
    // Création des lacs
    function createLake(x, z, size) {
        const lakeGeometry = new THREE.CircleGeometry(size, 64);
        lakeGeometry.rotateX(-Math.PI / 2);
        
        const waterTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg');
        waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(size / 100, size / 100);
        
        const lakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a8cff,
            transparent: true,
            opacity: 0.9,
            roughness: 0.1,
            metalness: 0.5,
            normalMap: waterTexture
        });
        
        const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
        lake.position.set(x, 0, z);
        scene.add(lake);
        
        return lake;
    }
    
    // Génération de plusieurs lacs dans les zones basses
    for (let i = 0; i < 5; i++) {
        // Trouver un point bas
        let x, z, y = Infinity;
        for (let j = 0; j < 10; j++) {
            const testX = Math.random() * terrainSize - terrainSize/2;
            const testZ = Math.random() * terrainSize - terrainSize/2;
            const testY = getTerrainHeightAt(testX, testZ, terrain);
            
            if (testY < y && testY < 10) {
                x = testX;
                z = testZ;
                y = testY;
            }
        }
        
        if (y < 10) {
            const size = 300 + Math.random() * 700;
            createLake(x, z, size);
        }
    }
    
    return terrain;
    
    // Fonction utilitaire pour obtenir la hauteur du terrain à une position donnée
    function getTerrainHeightAt(x, z, terrainMesh) {
        // Conversion des coordonnées mondiales en coordonnées locales du mesh
        const localPos = terrainMesh.worldToLocal(new THREE.Vector3(x, 0, z));
        
        // Trouver le triangle le plus proche (simplifié)
        const geometry = terrainMesh.geometry;
        const positions = geometry.attributes.position.array;
        let closestY = 0;
        let minDist = Infinity;
        
        for (let i = 0; i < positions.length; i += 3) {
            const px = positions[i];
            const pz = positions[i+2];
            const dist = Math.sqrt((px-localPos.x)**2 + (pz-localPos.z)**2);
            
            if (dist < minDist) {
                minDist = dist;
                closestY = positions[i+1];
            }
        }
        
        return closestY + terrainMesh.position.y;
    }
}

// Classe SimplexNoise pour la génération procédurale
class SimplexNoise {
    constructor() {
        this.grad3 = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];
        this.p = [];
        for (let i=0; i<256; i++) this.p[i] = Math.floor(Math.random()*256);
        this.perm = [];
        for (let i=0; i<512; i++) this.perm[i] = this.p[i & 255];
    }
    
    dot(g, x, y) { return g[0]*x + g[1]*y; }
    
    noise2D(xin, yin) {
        let n0, n1, n2;
        const F2 = 0.5*(Math.sqrt(3.0)-1.0);
        const s = (xin+yin)*F2;
        const i = Math.floor(xin+s);
        const j = Math.floor(yin+s);
        const G2 = (3.0-Math.sqrt(3.0))/6.0;
        const t = (i+j)*G2;
        const X0 = i-t;
        const Y0 = j-t;
        const x0 = xin-X0;
        const y0 = yin-Y0;
        let i1, j1;
        if(x0>y0) { i1=1; j1=0; } else { i1=0; j1=1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii+this.perm[jj]] % 12;
        const gi1 = this.perm[ii+i1+this.perm[jj+j1]] % 12;
        const gi2 = this.perm[ii+1+this.perm[jj+1]] % 12;
        let t0 = 0.5 - x0*x0 - y0*y0;
        if(t0<0) n0 = 0.0;
        else { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
        let t1 = 0.5 - x1*x1 - y1*y1;
        if(t1<0) n1 = 0.0;
        else { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
        let t2 = 0.5 - x2*x2 - y2*y2;
        if(t2<0) n2 = 0.0;
        else { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
        return 70.0 * (n0 + n1 + n2);
    }
}

// Génération du terrain procédural
generateProceduralTerrain();

// 7. Contrôles (inchangé)
const controls = {
    speed: 4,
    maxSpeed: 15,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 5,
    targetRoll: 0,
    keys: {},
    lastDirection: null
};

document.addEventListener('keydown', (e) => {
    controls.keys[e.key.toLowerCase()] = true;

    if (e.key === 'ArrowLeft' && sounds.left && !sounds.left.isPlaying) {
        sounds.left.play();
        controls.lastDirection = 'left';
    } else if (e.key === 'ArrowRight' && sounds.right && !sounds.right.isPlaying) {
        sounds.right.play();
        controls.lastDirection = 'right';
    } else if ((e.key === 'ArrowUp' || e.key === 's') && sounds.up && !sounds.up.isPlaying) {
        sounds.up.play();
        controls.lastDirection = 'up';
    } else if ((e.key === 'ArrowDown' || e.key === 'x') && sounds.down && !sounds.down.isPlaying) {
        sounds.down.play();
        controls.lastDirection = 'down';
    }
});

document.addEventListener('keyup', (e) => {
    controls.keys[e.key.toLowerCase()] = false;

    if (e.key === 'ArrowLeft' && sounds.left) sounds.left.stop();
    if (e.key === 'ArrowRight' && sounds.right) sounds.right.stop();
    if ((e.key === 'ArrowUp' || e.key === 's') && sounds.up) sounds.up.stop();
    if ((e.key === 'ArrowDown' || e.key === 'x') && sounds.down) sounds.down.stop();
});

// 8. Animation principale (simplifiée sans météo)
function animate() {
    requestAnimationFrame(animate);

    if (!airplane) return;

    // Contrôles (inchangé)
    if (controls.keys['arrowup']) controls.speed = Math.min(controls.speed + 0.01, controls.maxSpeed);
    if (controls.keys['arrowdown']) controls.speed = Math.max(controls.speed - 0.01, controls.minSpeed);

    if (controls.keys['arrowleft']) {
        controls.targetRoll = maxRollAngle;
        airplane.rotation.y += controls.turnSpeed * 0.5;
    }
    else if (controls.keys['arrowright']) {
        controls.targetRoll = -maxRollAngle;
        airplane.rotation.y -= controls.turnSpeed * 0.5;
    }
    else {
        controls.targetRoll = 0;
    }

    airplane.rotation.z += (controls.targetRoll - airplane.rotation.z) * 0.1;

    const maxPitchAngle = THREE.MathUtils.degToRad(20);
    if (controls.keys['s']) {
        controls.targetPitch = maxPitchAngle;
    }
    else if (controls.keys['x']) {
        controls.targetPitch = -maxPitchAngle;
    }
    else {
        controls.targetPitch = 0;
    }

    airplane.rotation.x += (controls.targetPitch - airplane.rotation.x) * 0.1;

    // Mouvement (inchangé)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplane.quaternion);
    airplane.position.add(direction.multiplyScalar(controls.speed));

    // Mise à jour du son du moteur (inchangé)
    if (sounds.engine) {
        sounds.engine.setVolume(Math.min(controls.speed / 5, 0.7));
    }

    // Camera (inchangé)
    const cameraOffset = new THREE.Vector3(0, 3, 10);
    cameraOffset.applyQuaternion(airplane.quaternion);
    camera.position.copy(airplane.position).add(cameraOffset);
    camera.lookAt(airplane.position);

    // Animations
    animateClouds();

    // Mise à jour HUD (inchangé)
    if (airplane) {
        const altitude = Math.max(0, airplane.position.y - (-50));
        document.getElementById('altitude').textContent = Math.round(altitude);
        document.getElementById('speed').textContent = Math.round(controls.speed * 20);
        document.getElementById('pitch').textContent = Math.round(THREE.MathUtils.radToDeg(airplane.rotation.x));
        document.getElementById('roll').textContent = Math.round(THREE.MathUtils.radToDeg(airplane.rotation.z));

        // Artificial Horizon
        const horizon = document.getElementById('horizon-line');
        const skyElement = document.getElementById('sky');
        const groundElement = document.getElementById('ground');
        const pitch = THREE.MathUtils.radToDeg(airplane.rotation.x);
        const roll = THREE.MathUtils.radToDeg(airplane.rotation.z);
        horizon.style.transform = `rotate(${roll}deg) translateY(${pitch * 0.5}px)`;
        skyElement.style.height = `${50 + pitch * 0.25}%`;
        groundElement.style.height = `${50 - pitch * 0.25}%`;
    }

    renderer.render(scene, camera);
}

// Démarrer
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
