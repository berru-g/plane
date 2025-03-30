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

// 4. Chargement du modèle 3D
const loader = new THREE.GLTFLoader();
loader.load(
    'https://raw.githubusercontent.com/berru-g/plane/main/avion/cessna172.glb',
    (gltf) => {
        airplane = gltf.scene;
        airplane.scale.set(14, 14, 14);
        airplane.rotation.set(Math.PI, Math.PI, 0);
        scene.add(airplane);
        document.getElementById('loading').style.display = 'none';
    },
    undefined,
    (error) => {
        console.error(error);
    }
);

// 5. Ciel fixe avec une image
const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/sunrise.jpg');
const skyGeometry = new THREE.SphereGeometry(12000, 128, 128);
const skyMaterial = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// 6. Génération procédurale de la map
function generateProceduralTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 200, 200);
    groundGeometry.rotateX(-Math.PI / 2);

    const positions = groundGeometry.attributes.position;

    // Fonction de bruit pour créer des montagnes et des lacs
    function noise(x, z) {
        return Math.sin(x * 0.01) * Math.cos(z * 0.01) * 50 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 25;
    }

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        let y = noise(x, z); // Hauteur du terrain
        if (Math.random() < 0.05) y -= Math.abs(noise(x * 0.5, z * 0.5)) * 50; // Lacs
        positions.setY(i, y - 50); // Ajuste la hauteur globale
    }

    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg'),
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -50;
    scene.add(ground);

    // Ajout de lacs procéduraux
    for (let i = 0; i < Math.random() * 5 + 3; i++) {
        const lakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a8cff,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.5,
            normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg'),
        });

        const lakeGeometry = new THREE.PlaneGeometry(1000 + Math.random() * 1500, 1000 + Math.random() * 1500);
        const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);

        lake.rotation.x = -Math.PI / 2;
        lake.position.set((Math.random() - 0.5) * 18000, -45, (Math.random() - 0.5) * 18000);

        scene.add(lake);
    }
}
generateProceduralTerrain();

// Suppression des effets sonores
// Les sons ont été retirés conformément à votre demande.

// Contrôles de l'avion
const controls = {
    speed: 4,
    maxSpeed: 15,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 0.2,
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') controls.speed += controls.speed < controls.maxSpeed ? 1 : 0;
    if (e.key === 'ArrowDown') controls.speed -= controls.speed > controls.minSpeed ? 1 : 0;
});

// Animation principale
function animate() {
    requestAnimationFrame(animate);

    if (airplane) {
        const direction = new THREE.Vector3(0, -1, -1).normalize();
        direction.applyQuaternion(airplane.quaternion);
        airplane.position.add(direction.multiplyScalar(controls.speed));

        camera.position.copy(airplane.position).add(new THREE.Vector3(10, -3, -30));
        camera.lookAt(airplane.position);
    }

    renderer.render(scene, camera);
}
animate();

// Ajustement de la fenêtre lors du redimensionnement
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});