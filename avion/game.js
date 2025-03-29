// 1. Initialisation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Lumière
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, -1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 3. Variables
let airplane;
const maxRollAngle = THREE.MathUtils.degToRad(35); // 35° de roulis

// 4. Chargement du modèle 3D (Porco Rosso)
const loader = new THREE.GLTFLoader();
loader.load(
    'https://raw.githubusercontent.com/berru-g/plane/main/avion/cessna172.glb',
    (gltf) => {
        airplane = gltf.scene;
        airplane.scale.set(10, 10, 10);
        airplane.rotation.Y = Math.PI;
        airplane.rotation.set(Math.PI, Math.PI, 0);
        scene.add(airplane);
        document.getElementById('loading').style.display = 'none';
    },
    undefined,
    (error) => console.error(error)
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

// 5. Environnement - TEXTURES ET LACS (NOUVEAU)
const textureLoader = new THREE.TextureLoader(); //https://raw.githubusercontent.com/kenneyassets/NatureKit/textures/Ground037_1K_Color.png
const grassTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(30, 30);

const waterTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg');
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

// Ciel (existant)
const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87CEEB,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// ▲▲▲ NUAGES ET CIEL AMÉLIORÉ ▲▲▲
// 1. Nouveau ciel avec dégradé //
const skyTexture = new THREE.TextureLoader().load('https://github.com/berru-g/assoberru/main/src-img/cosmos.png?raw=true');
scene.background = new THREE.Color(0x87CEEB); 
scene.background = skyTexture;

// 2. Nuages (particules)
const cloudTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cloud.png');
const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.8
});
const fog = new THREE.FogExp2(0x87CEEB, 0.0005);
scene.fog = fog;

// Création de 50 nuages positionnés aléatoirement
for (let i = 0; i < 50; i++) {
    const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        cloudMaterial
    );
    cloud.position.set(
        Math.random() * 10000 - 5000,
        Math.random() * 1000 + 500,
        Math.random() * 10000 - 5000
    );
    cloud.rotation.x = Math.PI / 2; // Orientation horizontale
    scene.add(cloud);
}

// 3. Animation des nuages (à ajouter dans animate())
function animateClouds() {
    scene.children.forEach(child => {
        if (child.isMesh && child.material === cloudMaterial) {
            child.position.x -= 0.1 * (1 + Math.random() * 0.5);
            if (child.position.x < -6000) child.position.x = 6000;
        }
    });
}
// ▲▲▲ FIN DES AJOUTS ▲▲▲
// Sol avec collines (modifié pour la texture)
const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
groundGeometry.rotateX(-Math.PI / 2);
const positions = groundGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    positions.setY(i, Math.sin(x * 0.01) * 20 + Math.cos(z * 0.01) * 20);
}
positions.needsUpdate = true;

const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({ 
        map: grassTexture,
        side: THREE.DoubleSide,
        roughness: 0.8
    })
);
ground.position.y = -50;
scene.add(ground);

// Lacs (NOUVEAU)
const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a8cff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.5,
    normalMap: waterTexture
});

const lakes = [
    { x: -1500, z: 2000, width: 800, height: 1200, rotation: 0.2 },
    { x: 1800, z: -1000, width: 1500, height: 800, rotation: -0.1 },
    { x: 500, z: 2500, width: 1000, height: 1000, rotation: 0 }
];

lakes.forEach(lake => {
    const lakeGeometry = new THREE.PlaneGeometry(lake.width, lake.height);
    const lakeMesh = new THREE.Mesh(lakeGeometry, waterMaterial);
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.rotation.z = lake.rotation;
    lakeMesh.position.set(lake.x, -48, lake.z);
    scene.add(lakeMesh);
});

// 6. Contrôles (existant inchangé)
const controls = {
    speed: 0.5,
    maxSpeed: 4,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 0.015,
    targetRoll: 0,
    keys: {}
};

document.addEventListener('keydown', (e) => {
    controls.keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    controls.keys[e.key.toLowerCase()] = false;
});

// 8. Animation (avec ajout animation eau)
function animate() {
    requestAnimationFrame(animate);
    
    if (!airplane) return;

    // Contrôles existants inchangés...
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

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplane.quaternion);
    airplane.position.add(direction.multiplyScalar(controls.speed));

    const cameraOffset = new THREE.Vector3(0, 3, 10);
    cameraOffset.applyQuaternion(airplane.quaternion);
    camera.position.copy(airplane.position).add(cameraOffset);
    camera.lookAt(airplane.position);

    // Animation eau (NOUVEAU)
    waterTexture.offset.x += 0.0005;
    waterTexture.offset.y += 0.0005;

    animateClouds(); // Déplace les nuages

    renderer.render(scene, camera);
}

// Démarrer
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});