/* ==========================================================================
   NAVSMART 3D PHOTOREALISTIC CONTINENT GLOBE & WARP DIVE ENGINE
   ========================================================================== */
export function initCinematicIntro() {
    const container = document.getElementById('threeDCanvasContainer');
    const overlay = document.getElementById('cyberIntroOverlay');
    const enterBtn = document.getElementById('enterCommandCenterBtn');
    const introContent = document.querySelector('.intro-content');

    if (!container || !window.THREE) return;

    // 1. Scene, Camera & Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 10, 260);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x00f3ff, 2.5);
    sunLight.position.set(150, 80, 120);
    scene.add(sunLight);

    const backRimLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    backRimLight.position.set(-150, -50, -100);
    scene.add(backRimLight);

    // 3. Globe Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // High-resolution NASA Earth Map Texture with Continents
    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
    );
    const earthBump = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'
    );

    // 3.1 Continents Earth Sphere
    const globeGeo = new THREE.SphereGeometry(65, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
        map: earthMap,
        normalMap: earthBump,
        roughness: 0.6,
        metalness: 0.15,
        color: 0xd6f7ff
    });
    const earthMesh = new THREE.Mesh(globeGeo, globeMat);
    earthGroup.add(earthMesh);

    // 3.2 Holographic Grid Mesh Overlay
    const gridGeo = new THREE.SphereGeometry(65.6, 36, 36);
    const gridMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    earthGroup.add(gridMesh);

    // 3.3 Glowing Cyber Atmosphere Shader
    const atmosphereGeo = new THREE.SphereGeometry(67.5, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
                gl_FragColor = vec4(0.0, 0.95, 1.0, 1.0) * intensity;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // 4. Tactical Data Points & Orbital Satellites
    const dotGeo = new THREE.BufferGeometry();
    const dotCount = 800;
    const dotPositions = new Float32Array(dotCount * 3);

    for (let i = 0; i < dotCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 74 + Math.random() * 25;
        dotPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        dotPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        dotPositions[i + 2] = r * Math.cos(phi);
    }
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
        size: 1.6,
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.7
    });
    const dotParticles = new THREE.Points(dotGeo, dotMat);
    scene.add(dotParticles);

    // Orbital Tactical Rings
    const ringGeo = new THREE.RingGeometry(88, 89.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.4;
    earthGroup.add(ringMesh);

    // 5. Animation States & Easing
    let animationFrameId;
    let isTransitioning = false;
    let transitionProgress = 0;

    // Target coordinates on globe to dive into
    const targetFocus = new THREE.Vector3(12, 10, 65);

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        if (!isTransitioning) {
            // Idle organic rotation
            earthGroup.rotation.y += 0.0022;
            earthGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;
            dotParticles.rotation.y -= 0.0008;
        } else {
            // Exponential Cinematic Zoom-Dive toward the landmass terrain
            transitionProgress += 0.016;
            const ease = Math.min(1, transitionProgress * transitionProgress * (3 - 2 * transitionProgress));

            // Camera zooms close to the surface
            camera.position.z = THREE.MathUtils.lerp(260, 68, ease);
            camera.position.y = THREE.MathUtils.lerp(10, targetFocus.y, ease);
            camera.position.x = THREE.MathUtils.lerp(0, targetFocus.x, ease);
            camera.lookAt(targetFocus);

            earthGroup.rotation.y += 0.008;
        }

        renderer.render(scene, camera);
    }
    animate();

    // 6. Resize Event Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 7. Button Trigger & Smooth Transition
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            enterBtn.disabled = true;
            isTransitioning = true;

            // Fade out the center card first
            if (introContent) {
                introContent.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                introContent.style.opacity = '0';
                introContent.style.transform = 'scale(0.92)';
            }

            // After camera dives near surface, dissolve the overlay smoothly
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    cancelAnimationFrame(animationFrameId);
                    overlay.remove();
                }, 1100);
            }, 850);
        });
    }
}