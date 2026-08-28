/* ==========================================================================
   NAVSMART 3D CYBERNETIC GLOBE INTRO ENGINE (THREE.JS)
   ========================================================================== */
export function initCinematicIntro() {
    const container = document.getElementById('threeDCanvasContainer');
    const overlay = document.getElementById('cyberIntroOverlay');
    const enterBtn = document.getElementById('enterCommandCenterBtn');
    
    if (!container || !window.THREE) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Holographic Sphere Wireframe
    const globeGeo = new THREE.SphereGeometry(65, 36, 36);
    const globeMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Inner Glowing Core Sphere
    const coreGeo = new THREE.SphereGeometry(62, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x060b19,
        transparent: true,
        opacity: 0.85
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // 3. Floating Orbital Particle Ring
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 75 + Math.random() * 30;

        posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = radius * Math.cos(phi);
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 1.8,
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.75
    });
    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleMesh);

    // 4. Orbital Ring
    const ringGeo = new THREE.RingGeometry(85, 87, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    scene.add(ring);

    // 5. Window Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 6. Animation Loop
    let animationFrameId;
    let warpSpeed = false;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        globe.rotation.y += warpSpeed ? 0.08 : 0.003;
        globe.rotation.x += 0.001;
        particleMesh.rotation.y -= warpSpeed ? 0.06 : 0.002;
        ring.rotation.z += 0.004;

        if (warpSpeed) {
            camera.position.z -= 4; // Warp zoom in effect
        }

        renderer.render(scene, camera);
    }
    animate();

    // 7. Transition Into Command Center
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            warpSpeed = true; // Engage warp drive
            enterBtn.disabled = true;

            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    cancelAnimationFrame(animationFrameId);
                    overlay.remove();
                }, 1200);
            }, 500);
        });
    }
}