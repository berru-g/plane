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

// Sons directionnels
const soundLoader = new THREE.AudioLoader();
const sounds = {
    left: new THREE.PositionalAudio(audioListener),
    right: new THREE.PositionalAudio(audioListener),
    up: new THREE.PositionalAudio(audioListener),
    down: new THREE.PositionalAudio(audioListener),
    engine: new THREE.PositionalAudio(audioListener)
};

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

// 6. Environnement
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(30, 30);
// lac
const waterTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg');
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;

// Ciel
const skyTexture = textureLoader.load('https://raw.githubusercontent.com/berru-g/plane/refs/heads/main/avion/sunrise.jpg');
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
        positions[i + 1] += (Math.random() - 0.3) * 0.3;
        positions[i + 2] += (Math.random() - 0.5) * 0.5;

        if (Math.abs(positions[i]) > 1000 ||
            Math.abs(positions[i + 1]) > 700 ||
            Math.abs(positions[i + 2]) > 1000) {
            positions[i] = Math.random() * 500 - 250;
            positions[i + 1] = Math.random() * 300 + 100;
            positions[i + 2] = Math.random() * 500 - 250;
        }
    }
    birdGeometry.attributes.position.needsUpdate = true;
}

// Nuages
const cloudTexture = new THREE.TextureLoader().load('https://github.com/berru-g/plane/blob/main/avion/layered.jpg?raw=true');
const cloudMaterial = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.3
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

// Génération procédurale du terrain
function generateProceduralTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 200, 200);
    groundGeometry.rotateX(-Math.PI / 2);
    const positions = groundGeometry.attributes.position;
    
    // Seed aléatoire pour la cohérence
    const seed = Math.floor(Math.random() * 10000);
    
    // Fonction de bruit améliorée
    function noise(x, z) {
        x = x * 0.01 + seed;
        z = z * 0.01 + seed;
        return Math.sin(x) * Math.cos(z) * 1.5 + 
               Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.8 +
               Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;
    }
    
    // Génération des hauteurs
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        
        // Base aléatoire
        let y = noise(x, z) * 100;
        
        // Ajout de caractéristiques naturelles
        y += Math.max(0, noise(x * 1.5, z * 1.5) * 50); // Collines
        y -= Math.abs(noise(x * 0.3, z * 0.3) * 20);   // Vallées
        
        // Position Y finale
        positions.setY(i, y - 50);
    }
    
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(
        groundGeometry,
        new THREE.MeshStandardMaterial({
            map: grassTexture,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.1
        })
    );
    ground.position.y = -50;
    scene.add(ground);
    
    // Génération procédurale des lacs
    function generateLakes() {
        const lakeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a8cff,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.5,
            normalMap: waterTexture
        });
        
        // Crée 3-5 lacs dans les zones basses
        for (let i = 0; i < 4 + Math.floor(Math.random() * 2); i++) {
            const lakeGeometry = new THREE.PlaneGeometry(1, 1);
            const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
            
            // Position aléatoire
            const x = (Math.random() - 0.5) * 18000;
            const z = (Math.random() - 0.5) * 20000;
            
            // Taille aléatoire
            const size = 800 + Math.random() * 1500;
            lake.scale.set(size, size, 1);
            
            // Trouve le point le plus bas dans la zone
            let minY = 0;
            for (let j = 0; j < 10; j++) {
                const testY = noise(x + (Math.random() - 0.5) * 500, 
                                  z + (Math.random() - 0.5) * 500) * 100 - 50;
                if (testY < minY) minY = testY;
            }
            
            if (minY < 8) { // Seulement si c'est assez bas
                lake.rotation.x = -Math.PI / 2;
                lake.position.set(x, minY + 1, z);
                scene.add(lake);
            }
        }
    }
    
    generateLakes();
    
    return ground;
}

// Génère le terrain procédural
generateProceduralTerrain();

// 7. Contrôles
const controls = {
    speed: 4,
    maxSpeed: 15,
    minSpeed: 0.1,
    turnSpeed: 0.02,
    pitchSpeed: 0.2,
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

setInterval(changeWeather, 10000);

function updateWeather() {
    if (weather.type !== weather.targetType) {
        weather.transition += 0.001;
        if (weather.transition >= 1) {
            weather.type = weather.targetType;
            weather.transition = 0;
        }
    }

    switch (weather.type) {
        case 'sunny':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0002, 0.01);
            sky.material.color.lerp(new THREE.Color(0x87CEEB), 0.01);
            break;
        case 'cloudy':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0003, 0.01);
            sky.material.color.lerp(new THREE.Color(0x778899), 0.01);
            break;
        case 'stormy':
            fog.density = THREE.MathUtils.lerp(fog.density, 0.0004, 0.01);
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

    // Mise à jour HUD
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

// Effet d'écran vieillot
setInterval(() => {
    if (Math.random() > 0.9) {
        document.querySelectorAll('.hud-value').forEach(el => {
            el.style.opacity = 0.5 + Math.random() * 0.5;
        });
    }
}, 300);