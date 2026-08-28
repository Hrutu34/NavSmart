/* ==========================================================================
   NAVSMART IMMERSIVE 3D GLOBE ENGINE - PRECISION MAP TARGETING & TECHNO AUDIO
   ========================================================================== */
export function initCinematicIntro(getMapCenterCallback) {
    const overlay = document.getElementById('cyberIntroOverlay');
    const container = document.getElementById('threeDCanvasContainer');
    const enterBtn = document.getElementById('enterCommandCenterBtn');
    const introContent = document.querySelector('.intro-content');

    if (!container || !overlay || !window.THREE) return;

    // --- Clean Cybernetic Web Audio Synth (Reverted to Sleek Tech Sound) ---
    let audioCtx = null;
    function playCyberSound(type) {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'whoosh') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.exponentialRampToValueAtTime(320, now + 1.2);
                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
                gain.gain.linearRampToValueAtTime(0.001, now + 1.3);
                osc.start(now);
                osc.stop(now + 1.3);
            }
        } catch (e) {
            // Audio context requires user gesture
        }
    }

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0c1e3d, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x00f3ff, 2.5);
    sunLight.position.set(160, 90, 160);
    scene.add(sunLight);

    const purpleRim = new THREE.DirectionalLight(0xa855f7, 1.6);
    purpleRim.position.set(-160, -70, -110);
    scene.add(purpleRim);

    // 3. Globe Group Setup
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const GLOBE_RADIUS = 58;

    // 3.1 Continents Texture Mapping
    function createCyberEarthTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#050c1c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 64) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 64) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 243, 255, 0.16)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            texture.needsUpdate = true;
        };
        return texture;
    }

    const earthMesh = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64),
        new THREE.MeshStandardMaterial({
            map: createCyberEarthTexture(),
            roughness: 0.5,
            metalness: 0.15,
            color: 0xdff6ff
        })
    );
    earthGroup.add(earthMesh);

    // 3.2 Atmosphere Glow
    const atmosMesh = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS + 1.2, 48, 48),
        new THREE.ShaderMaterial({
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
                    float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(0.0, 0.95, 1.0, 0.8) * intensity;
                }
            `,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        })
    );
    earthGroup.add(atmosMesh);

    // 3.3 Pin & Beacon Group
    const pinGroup = new THREE.Group();
    const pinBeacon = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 2.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff9d, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    pinGroup.add(pinBeacon);

    const pinCore = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 16),
        new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide })
    );
    pinGroup.add(pinCore);
    pinGroup.visible = false;
    earthGroup.add(pinGroup);

    // 3.4 Starfield & Orbit Rings
    const starPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400 * 3; i += 3) {
        const u = Math.random(), v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 68 + Math.random() * 40;
        starPos[i] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.5, color: 0x00ff9d, transparent: true, opacity: 0.7 }));
    scene.add(starField);

    const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(78, 79.2, 64),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    orbitRing.rotation.x = Math.PI / 2.3;
    earthGroup.add(orbitRing);

    // 4. Interactive Drag Controls
    let isDragging = false;
    let previousPos = { x: 0, y: 0 };
    let velocity = { x: 0, y: 0.0012 };

    function onPointerDown(e) {
        if (isFocusing) return;
        isDragging = true;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        previousPos = { x: cx, y: cy };
    }

    function onPointerMove(e) {
        if (!isDragging || isFocusing) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = cx - previousPos.x;
        const deltaY = cy - previousPos.y;

        velocity.y = deltaX * 0.003;
        velocity.x = deltaY * 0.003;

        earthGroup.rotation.y += velocity.y;
        earthGroup.rotation.x += velocity.x;

        previousPos = { x: cx, y: cy };
    }

    function onPointerUp() { isDragging = false; }

    overlay.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    overlay.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    function latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    // 5. Animation State & Smooth Focus Calculation
    let animationFrameId;
    let isFocusing = false;
    let focusStartTime = 0;
    const FOCUS_DURATION = 2400;

    const startQuat = new THREE.Quaternion();
    const targetQuat = new THREE.Quaternion();
    const startCamZ = 220;
    const targetCamZ = 125;

    function animate(currentTime) {
        animationFrameId = requestAnimationFrame(animate);

        if (!isFocusing) {
            if (!isDragging) {
                velocity.x *= 0.95;
                velocity.y = velocity.y * 0.95 + 0.001 * 0.05;
                earthGroup.rotation.y += velocity.y;
                earthGroup.rotation.x *= 0.96;
            }
            starField.rotation.y -= 0.0003;
        } else {
            const elapsed = currentTime - focusStartTime;
            const progress = Math.min(1.0, elapsed / FOCUS_DURATION);

            const ease = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            earthGroup.quaternion.slerpQuaternions(startQuat, targetQuat, ease);
            camera.position.z = startCamZ + (targetCamZ - startCamZ) * ease;

            const scale = 1 + Math.sin(Date.now() * 0.012) * 0.35;
            pinBeacon.scale.set(scale, scale, 1);
        }

        renderer.render(scene, camera);
    }
    animate(performance.now());

    function handleResize() {
        if (!container) return;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
    window.addEventListener('resize', handleResize);

    // 6. Action Button Trigger Sequence
    if (enterBtn) {
        enterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            enterBtn.disabled = true;

            playCyberSound('click');
            playCyberSound('whoosh');

            // Set default focus to India (Center coordinates: Lat 20.5937, Lng 78.9629)
            let lat = 20.5937, lng = 78.9629;
            if (typeof getMapCenterCallback === 'function') {
                const c = getMapCenterCallback();
                if (c && c.lat && c.lng) { 
                    lat = c.lat; 
                    lng = c.lng; 
                }
            }

            // Target Pin Placement
            const targetVec = latLngToVector3(lat, lng, GLOBE_RADIUS);
            pinGroup.position.copy(targetVec);
            pinGroup.lookAt(targetVec.clone().multiplyScalar(2));
            pinGroup.visible = true;

            // Accurate Target Rotation Orientation via LookAt Matrix Calculation
            startQuat.copy(earthGroup.quaternion);

            const tempObj = new THREE.Object3D();
            tempObj.position.copy(earthGroup.position);
            tempObj.quaternion.copy(earthGroup.quaternion);
            tempObj.lookAt(targetVec);
            tempObj.rotateY(Math.PI);
            targetQuat.copy(tempObj.quaternion);

            isFocusing = true;
            focusStartTime = performance.now();

            if (introContent) {
                introContent.classList.add('hide-ui');
            }

            // Staged Transition Sequence
            setTimeout(() => {
                overlay.classList.add('draw-border');

                setTimeout(() => {
                    const mapElement = document.getElementById('map') || document.querySelector('.left-panel');
                    if (mapElement) {
                        const rect = mapElement.getBoundingClientRect();
                        const resizeInterval = setInterval(handleResize, 16);

                        container.style.position = 'fixed';
                        container.style.transition = 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
                        container.style.top = `${rect.top}px`;
                        container.style.left = `${rect.left}px`;
                        container.style.width = `${rect.width}px`;
                        container.style.height = `${rect.height}px`;
                        container.style.borderRadius = '14px';

                        overlay.classList.add('morphing');
                        setTimeout(() => clearInterval(resizeInterval), 1450);
                    }

                    setTimeout(() => {
                        overlay.classList.add('reveal-app');
                        setTimeout(() => {
                            cancelAnimationFrame(animationFrameId);
                            overlay.remove();
                        }, 1200);
                    }, 1200);

                }, 400);

            }, FOCUS_DURATION);
        });
    }
}