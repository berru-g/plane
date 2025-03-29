// 1. Initialisation
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
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
    '/porco_plane.glb', // Remplacez par l'URL réel
    (gltf) => {
        airplane = gltf.scene;
        airplane.scale.set(0.5, 0.5, 0.5);
        airplane.rotation.set(0, Math.PI, 0); // Orientation initiale
        scene.add(airplane);
        document.getElementById('loading').style.display = 'none';
        resetPosition();
    },
    undefined,
    (error) => {
        console.error("Erreur de chargement :", error);
        document.getElementById('loading').textContent = "Erreur de chargement. Utilisation d'un modèle simplifié...";
        createFallbackAirplane();
    }
);

function createFallbackAirplane() {
    // Modèle de secours (cube stylisé)
    airplane = new THREE.Group();
    
    // Corps
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.3, 3, 8),
        new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    body.rotation.z = Math.PI/2;
    airplane.add(body);

    // Ailes
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
        airplane.rotation.set(0, Math.PI, 0); // Reset rotation
    }
    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);
}

// 5. Environnement
// Ciel
const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x87CEEB, 
    side: THREE.BackSide 
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Sol avec collines
const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 100);
groundGeometry.rotateX(-Math.PI/2);
const positions = groundGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    positions.setY(i, Math.sin(x * 0.01) * 20 + Math.cos(z * 0.01) * 20);
}
positions.needsUpdate = true;
const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshPhongMaterial({ 
        color: 0x3a5f0b,
        side: THREE.DoubleSide,
        flatShading: true
    })
);
ground.position.y = -50;
scene.add(ground);

// 6. Contrôles
const controls = {
    speed: 0.5,
    maxSpeed: 2,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 0.015,
    targetRoll: 0,
    keys: {}
};

// 7. Gestion clavier
document.addEventListener('keydown', (e) => {
    controls.keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    controls.keys[e.key.toLowerCase()] = false;
});

/* 8. Animation
function animate() {
    requestAnimationFrame(animate);
    
    if (!airplane) return;

    // Contrôles de vitesse
    if (controls.keys['arrowup']) controls.speed = Math.min(controls.speed + 0.01, controls.maxSpeed);
    if (controls.keys['arrowdown']) controls.speed = Math.max(controls.speed - 0.01, controls.minSpeed);

    // Roulis (effet de virage)
    if (controls.keys['arrowleft']) controls.targetRoll = maxRollAngle;
    else if (controls.keys['arrowright']) controls.targetRoll = -maxRollAngle;
    else controls.targetRoll = 0;

    // Lissage du roulis
    airplane.rotation.z += (controls.targetRoll - airplane.rotation.z) * 0.1;

    // Tangage (montée/descente)
    if (controls.keys['s']) airplane.rotation.x -= controls.pitchSpeed;
    if (controls.keys['x']) airplane.rotation.x += controls.pitchSpeed;

    // Mouvement
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplane.quaternion);
    airplane.position.add(direction.multiplyScalar(controls.speed));

    // Caméra (vue derrière l'avion)
    const cameraOffset = new THREE.Vector3(0, 3, 10);
    cameraOffset.applyQuaternion(airplane.quaternion);
    camera.position.copy(airplane.position).add(cameraOffset);
    camera.lookAt(airplane.position);

    renderer.render(scene, camera);
}
*/

function animate() {
    requestAnimationFrame(animate);
    
    if (!airplane) return;

    // Contrôles de vitesse (inchangé)
    if (controls.keys['arrowup']) controls.speed = Math.min(controls.speed + 0.01, controls.maxSpeed);
    if (controls.keys['arrowdown']) controls.speed = Math.max(controls.speed - 0.01, controls.minSpeed);

    // 1. Gestion du Roulis (35°) + Rotation Y coordonnée
    if (controls.keys['arrowleft']) {
        controls.targetRoll = maxRollAngle;
        airplane.rotation.y += controls.turnSpeed * 0.5; // Rotation douce en Y
    } 
    else if (controls.keys['arrowright']) {
        controls.targetRoll = -maxRollAngle;
        airplane.rotation.y -= controls.turnSpeed * 0.5; // Rotation douce en Y
    }
    else {
        controls.targetRoll = 0;
    }

    // Lissage du roulis (inchangé)
    airplane.rotation.z += (controls.targetRoll - airplane.rotation.z) * 0.1;

    // 2. Nouveau : Tangage (20° avant/arrière)
    const maxPitchAngle = THREE.MathUtils.degToRad(20); // 20° max
    if (controls.keys['s']) {
        controls.targetPitch = maxPitchAngle; // Avant vers le haut
    } 
    else if (controls.keys['x']) {
        controls.targetPitch = -maxPitchAngle; // Avant vers le bas
    }
    else {
        controls.targetPitch = 0;
    }
    
    // Lissage du tangage
    airplane.rotation.x += (controls.targetPitch - airplane.rotation.x) * 0.1;

    // Mouvement (inchangé)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplane.quaternion);
    airplane.position.add(direction.multiplyScalar(controls.speed));

    // Caméra (inchangé)
    const cameraOffset = new THREE.Vector3(0, 3, 10);
    cameraOffset.applyQuaternion(airplane.quaternion);
    camera.position.copy(airplane.position).add(cameraOffset);
    camera.lookAt(airplane.position);

    renderer.render(scene, camera);
}

// Démarrer
animate();

// Redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});