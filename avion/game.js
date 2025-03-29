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

// 4. Système audio
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Sons directionnels (utilisant des sons libres de droit)
const soundLoader = new THREE.AudioLoader();
const sounds = {
    left: new THREE.PositionalAudio(audioListener),
    right: new THREE.PositionalAudio(audioListener),
    up: new THREE.PositionalAudio(audioListener),
    down: new THREE.PositionalAudio(audioListener),
    engine: new THREE.PositionalAudio(audioListener)
};

// Chargement des sons (remplacez par vos URLs)
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

// 5. Chargement du modèle 3D
const loader = new THREE.GLTFLoader();
loader.load(
    'https://raw.githubusercontent.com/berru-g/plane/main/avion/cessna172.glb',
    (gltf) => {
        airplane = gltf.scene;
        airplane.scale.set(10, 10, 10);
        airplane.rotation.set(Math.PI, Math.PI, 0);
        
        // Attacher les sons à l'avion
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

// 6. Environnement
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(30, 30);

const waterTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg');
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

// Ciel
const skyTexture = textureLoader.load('https://github.com/berru-g/plane/raw/refs/heads/main/avion/golden_gate_hills_4k.exr');
const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87CEEB,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Étoiles
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ 
    color: 0xFFFFFF, 
    size: 0.5,
    transparent: true,
    opacity: 0
});
const starsPositions = [];

for (let i = 0; i < 10000; i++) {
    starsPositions.push(
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000
    );
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Oiseaux
const birdGeometry = new THREE.BufferGeometry();
const birdMaterial = new THREE.PointsMaterial({ 
    color: 0x333333, 
    size: 2 
});
const birdPositions = [];

for (let i = 0; i < 50; i++) {
    birdPositions.push(
        Math.random() * 2000 - 1000,
        Math.random() * 500 + 200,
        Math.random() * 2000 - 1000
    );
}

birdGeometry.setAttribute('position', new THREE.Float32BufferAttribute(birdPositions, 3));
const birdPoints = new THREE.Points(birdGeometry, birdMaterial);
scene.add(birdPoints);

// Animation des oiseaux
function animateBirds() {
    const positions = birdGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.5;
        positions[i+1] += (Math.random() - 0.3) * 0.3;
        positions[i+2] += (Math.random() - 0.5) * 0.5;
        
        if (Math.abs(positions[i]) > 1000 || 
            Math.abs(positions[i+1]) > 700 || 
            Math.abs(positions[i+2]) > 1000) {
            positions[i] = Math.random() * 500 - 250;
            positions[i+1] = Math.random() * 300 + 100;
            positions[i+2] = Math.random() * 500 - 250;
        }
    }
    birdGeometry.attributes.position.needsUpdate = true;
}

// Nuages
const cloudTexture = new THREE.TextureLoader().load('https://github.com/berru-g/plane/blob/main/avion/sunrise.jpg?raw=true');
const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.8
});
const fog = new THREE.FogExp2(0x87CEEB, 0.0005);
scene.fog = fog;

for (let i = 0; i < 100; i++) {
    const size = Math.random() * 300 + 100;
    const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        cloudMaterial.clone()
    );
    cloud.material.opacity = Math.random() * 0.6 + 0.2;
    cloud.position.set(
        Math.random() * 10000 - 5000,
        Math.random() * 1000 + 500,
        Math.random() * 10000 - 5000
    );
    cloud.rotation.x = Math.PI / 2;
    scene.add(cloud);
}

function animateClouds() {
    scene.children.forEach(child => {
        if (child.isMesh && child.material.map === cloudTexture) {
            child.position.x -= 0.1 * (1 + Math.random() * 0.5);
            if (child.position.x < -6000) child.position.x = 6000;
            child.position.y += Math.sin(Date.now() * 0.001 + child.position.x) * 0.1;
        }
    });
}

// Sol avec collines
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

// Lacs
const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a8cff,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.5,
    normalMap: waterTexture
});

const lakes = [
    { x: -1500, z: 2000, width: 800, height: 200, rotation: 0.2 },
    { x: 1800, z: -1000, width: 1500, height: 800, rotation: -0.1 },
    { x: 500, z: 2500, width: 1000, height: 1000, rotation: 0 },
    { x: -7000, z: 1900, width: 1900, height: 1800, rotation: 0.4 }
];

lakes.forEach(lake => {
    const lakeGeometry = new THREE.PlaneGeometry(lake.width, lake.height);
    const lakeMesh = new THREE.Mesh(lakeGeometry, waterMaterial);
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.rotation.z = lake.rotation;
    lakeMesh.position.set(lake.x, -48, lake.z);
    scene.add(lakeMesh);
});

// 7. Contrôles
const controls = {
    speed: 0.5,
    maxSpeed: 7,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 0.015,
    targetRoll: 0,
    keys: {},
    lastDirection: null
};

document.addEventListener('keydown', (e) => {
    controls.keys[e.key.toLowerCase()] = true;
    
    // Sons directionnels
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

// 8. Météo changeante
let weather = {
    type: 'sunny',
    transition: 0,
    targetType: 'sunny'
};

function changeWeather() {
    const weatherTypes = ['sunny', 'cloudy', 'stormy'];
    weather.targetType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
}

setInterval(changeWeather, 30000);

function updateWeather() {
    if (weather.type !== weather.targetType) {
        weather.transition += 0.001;
        if (weather.transition >= 1) {
            weather.type = weather.targetType;
            weather.transition = 0;
        }
    }
    
    switch(weather.type) {
        case 'sunny':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0002, 0.01);
            sky.material.color.lerp(new THREE.Color(0x87CEEB), 0.01);
            break;
        case 'cloudy':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0008, 0.01);
            sky.material.color.lerp(new THREE.Color(0x778899), 0.01);
            break;
        case 'stormy':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0015, 0.01);
            sky.material.color.lerp(new THREE.Color(0x36454F), 0.01);
            if (Math.random() < 0.001) {
                scene.children.forEach(light => {
                    if (light instanceof THREE.Light) {
                        light.intensity = 2;
                        setTimeout(() => { light.intensity = 1; }, 100);
                    }
                });
            }
            break;
    }
}

// 9. Cycle jour/nuit
let timeOfDay = 0;
const dayColor = new THREE.Color(0x87CEEB);
const nightColor = new THREE.Color(0x0a0a20);
const dawnColor = new THREE.Color(0xFFA500);

function updateSky() {
    timeOfDay += 0.0005;
    const t = Math.sin(timeOfDay) * 0.5 + 0.5;
    
    if (t < 0.3) {
        sky.material.color.lerpColors(nightColor, dawnColor, t * 3.33);
    } else if (t < 0.7) {
        sky.material.color.lerpColors(dawnColor, dayColor, (t - 0.3) * 2.5);
    } else {
        sky.material.color.lerp(dayColor, 0.01);
    }
    
    starsMaterial.opacity = THREE.MathUtils.smoothstep(0.7, 0.9, 1 - t);
    light.intensity = t * 0.8 + 0.2;
}

// 10. Animation principale
function animate() {
    requestAnimationFrame(animate);

    if (!airplane) return;

    // Contrôles
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

    // Mouvement
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(airplane.quaternion);
    airplane.position.add(direction.multiplyScalar(controls.speed));

    // Mise à jour du son du moteur
    if (sounds.engine) {
        sounds.engine.setVolume(Math.min(controls.speed / 5, 0.7));
    }

    // Camera
    const cameraOffset = new THREE.Vector3(0, 3, 10);
    cameraOffset.applyQuaternion(airplane.quaternion);
    camera.position.copy(airplane.position).add(cameraOffset);
    camera.lookAt(airplane.position);

    // Animations
    waterTexture.offset.x += 0.0005;
    waterTexture.offset.y += 0.0005;
    
    animateClouds();
    animateBirds();
    updateSky();
    updateWeather();

    renderer.render(scene, camera);
}

// Démarrer
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});