/* ==========================================================================
   NAVSMART - FUTURISTIC CYBER COMMAND CENTER FRONTEND CLIENT
   ========================================================================== */
import { getUserLocation, populatePOIs, clearPOIMarkers } from "./mapService.js";
import { initDirections, calculateItineraryWithStops } from "./routeService.js";
import { initCinematicIntro } from "./introCinematic.js";


let map, polylineOverlay, startMarker, endMarker;
let chatSocket = null;
let currentAssistantMsgObj = null;
let rawStreamingText = "";
let isRecording = false;
let currentItinerary = [];
let intermediateStops = [];

// ==========================================================================
// 1. INITIALIZATION & SETUP
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Passing callback to extract live Google Map center coordinates
    initCinematicIntro(() => {
        if (map && map.getCenter) {
            return {
                lat: map.getCenter().lat(),
                lng: map.getCenter().lng()
            };
        }
        return { lat: 22.5726, lng: 88.3638 }; // Default Kolkata Coordinates
    });
    initCanvasParticles();
    setupTabSwitching();
    setupQuickPrompts();
    
    
    // Fetch frontend configuration (e.g. Google Maps API Key)
    try {
        const configResp = await fetch('/api/config');
        const config = await configResp.json();
        if (config.googleMapsApiKey) {
            loadGoogleMapsScript(config.googleMapsApiKey);
        } else {
            initDefaultMap();
        }
    } catch (e) {
        initDefaultMap();
    }

    setupChatSocket();
    setupEventListeners();
});

// Load Google Maps JS API dynamically with callback & places library
function loadGoogleMapsScript(apiKey) {
    if (window.google && window.google.maps) {
        initMap();
        return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Initialize Google Maps in dark cyber theme
window.initMap = function() {
    const initialLocation = { lat: 22.5726, lng: 88.3638 }; // Kolkata default
    
    const darkMapStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#0a0f1d" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#758fae" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0a0f1d" }] },
        { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2d48" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#0e1526" }] },
        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#111a2e" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1b273d" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#00f3ff" }, { "weight": 0.5 }, { "lightness": -50 }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#060a14" }] }
    ];

    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    try {
        map = new google.maps.Map(mapElement, {
            zoom: 6,
            center: initialLocation,
            styles: darkMapStyle,
            disableDefaultUI: false,
            zoomControl: true,
        });
        
        // Initialize routing service with the new map instance
        initDirections(map);
        
        updateMapOverlayStatus("Google Maps GeoEngine Active");
    } catch (e) {
        initDefaultMap();
    }
};

function initDefaultMap() {
    updateMapOverlayStatus("Standard Map Active");
}

function updateMapOverlayStatus(text) {
    const el = document.getElementById("mapOverlayStatus");
    if (el) el.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${text}`;
}

// ==========================================================================
// 2. WEBSOCKET REAL-TIME RESPONSE STREAMING
// ==========================================================================
function setupChatSocket() {
    const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${protocol}${location.host}/ws/chat`;

    chatSocket = new WebSocket(wsUrl);

    chatSocket.onopen = () => {
        updateServerStatus(true);
    };

    chatSocket.onclose = () => {
        updateServerStatus(false);
        setTimeout(setupChatSocket, 2000);
    };

    chatSocket.onerror = () => {
        updateServerStatus(false);
    };

    chatSocket.onmessage = (event) => {
        const token = event.data;

        if (token === "[__STREAM_COMPLETE__]") {
            finalizeCurrentStreamingMessage();
            return;
        }

        if (!currentAssistantMsgObj) {
            currentAssistantMsgObj = createAssistantMessageCard();
        }

        rawStreamingText += token;
        renderStreamingMarkdown(currentAssistantMsgObj, rawStreamingText);
    };
}

function updateServerStatus(online) {
    const pill = document.getElementById("serverStatus");
    if (pill) {
        if (online) {
            pill.innerHTML = `<i class="fa-solid fa-network-wired"></i> WS: CONNECTED`;
            pill.style.color = "var(--green-accent)";
        } else {
            pill.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> RECONNECTING...`;
            pill.style.color = "#fbbf24";
        }
    }
}

function createAssistantMessageCard() {
    const container = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'streaming-cursor';

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(cursorSpan);

    container.appendChild(msgDiv);
    scrollChatToBottom();

    return { card: msgDiv, content: contentDiv, cursor: cursorSpan };
}

function renderStreamingMarkdown(msgObj, text) {
    const cleanText = sanitizeCyberText(text);
    let htmlContent = "";
    if (window.marked && typeof window.marked.parse === 'function') {
        try {
            htmlContent = marked.parse(cleanText);
        } catch (e) {
            htmlContent = formatCustomMarkdown(cleanText);
        }
    } else {
        htmlContent = formatCustomMarkdown(cleanText);
    }

    msgObj.content.innerHTML = htmlContent;
    scrollChatToBottom();
}

function finalizeCurrentStreamingMessage() {
    if (currentAssistantMsgObj) {
        if (currentAssistantMsgObj.cursor) {
            currentAssistantMsgObj.cursor.remove();
        }
        currentAssistantMsgObj = null;
        rawStreamingText = "";
    }
}

function formatCustomMarkdown(text) {
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Clean Section Titles
    escaped = escaped.replace(/^### (.*$)/gim, '<div class="chat-section-header">$1</div>');
    escaped = escaped.replace(/^## (.*$)/gim, '<div class="chat-section-header main">$1</div>');
    escaped = escaped.replace(/^# (.*$)/gim, '<div class="chat-section-header main">$1</div>');

    // Bold, Italics, Code
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/`(.*?)`/g, '<code>$1</code>');

    // Bullet points
    escaped = escaped.replace(/^\- (.*$)/gim, '<li class="chat-bullet">$1</li>');
    escaped = escaped.replace(/(<li class="chat-bullet">.*<\/li>)/gims, '<ul class="chat-list">$1</ul>');

    // Line breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

function appendUserMessage(text) {
    const container = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.textContent = text;
    container.appendChild(msgDiv);
    scrollChatToBottom();
}

function scrollChatToBottom() {
    const viewport = document.getElementById('chatContent');
    if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
    }
}

// ==========================================================================
// 3. CHAT INPUT, COMMAND HANDLERS & POI HOOKS
// ==========================================================================
function setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const micBtn = document.getElementById('micBtn');
    const genItineraryBtn = document.getElementById('genItineraryBtn');

    if (sendBtn) sendBtn.addEventListener('click', handleSendChatMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSendChatMessage();
        });
    }

    if (micBtn) micBtn.addEventListener('click', toggleVoiceRecognition);
    if (genItineraryBtn) genItineraryBtn.addEventListener('click', handleGenerateItinerary);

    // Contextual exploration POI buttons if present in your markup
    document.querySelectorAll('[data-poi]').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-poi');
            handleExplorePOIs(category);
        });
    });
}

async function handleSendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const text = chatInput ? chatInput.value.trim() : '';
    if (!text) return;

    appendUserMessage(text);
    chatInput.value = '';

    const lower = text.toLowerCase();

    // 1. Natural Language Geolocation Trigger
    if (lower.includes("my location") || lower.includes("where am i") || lower.includes("current location")) {
        try {
            updateMapOverlayStatus("Detecting GPS coordinates...");
            const pos = await getUserLocation();
            if (map) {
                map.setCenter(pos);
                map.setZoom(15);
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: "Your Location",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 9,
                        fillColor: "#00ff9d",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2
                    }
                });
            }
            updateMapOverlayStatus("GPS Acquired");
        } catch (err) {
            updateMapOverlayStatus("Location detection error");
        }
    }

    // 2. Multi-Stop & Routing Queries ("from A to B via C" or "from A to B")
    if (lower.includes("from ") && lower.includes(" to ")) {
        extractAndRoute(text);
    } 
    // 3. Natural Language POI Discovery Triggers
    else if (lower.includes("food") || lower.includes("restaurant") || lower.includes("delicac")) {
        handleExplorePOIs("DELICACIES");
    } else if (lower.includes("sightseeing") || lower.includes("monument") || lower.includes("tourist")) {
        handleExplorePOIs("SIGHTSEEING");
    } else if (lower.includes("hotel") || lower.includes("rest") || lower.includes("cafe")) {
        handleExplorePOIs("RESTING");
    }

    // 4. Send chat message to WebSocket
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(text);
    } else {
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        })
        .then(r => r.json())
        .then(data => {
            const assistantObj = createAssistantMessageCard();
            renderStreamingMarkdown(assistantObj, data.reply || "Response generated.");
            assistantObj.cursor.remove();
        });
    }
}

// Parse "from [Origin] to [Destination] via/stopping at [Stop1, Stop2]"
async function extractAndRoute(text) {
    try {
        const fromIdx = text.toLowerCase().indexOf("from ");
        const toIdx = text.toLowerCase().indexOf(" to ");
        const viaIdx = text.toLowerCase().indexOf(" via ");

        let origin = "";
        let destination = "";
        let stops = [];

        if (fromIdx !== -1 && toIdx !== -1) {
            origin = text.substring(fromIdx + 5, toIdx).trim();

            if (viaIdx !== -1 && viaIdx > toIdx) {
                destination = text.substring(toIdx + 4, viaIdx).trim();
                const stopsPart = text.substring(viaIdx + 5).trim();
                stops = stopsPart.split(/,| and /).map(s => s.trim()).filter(Boolean);
            } else {
                destination = text.substring(toIdx + 4).trim();
            }

            updateMapOverlayStatus(`Calculating route: ${origin} ➔ ${destination}`);
            currentItinerary = await calculateItineraryWithStops(origin, destination, stops);
            
            // Format itinerary automatically inside the itinerary tab
            renderDirectionsItinerary(currentItinerary);
            updateMapOverlayStatus("Multi-Stop Itinerary Active");
        }
    } catch (e) {
        fetchAndDrawRoute(text);
    }
}

function handleExplorePOIs(category) {
    clearPOIMarkers();
    if (!map) return;

    if (currentItinerary.length > 0) {
        updateMapOverlayStatus(`Populating ${category.toLowerCase()} along route...`);
        currentItinerary.forEach((leg) => {
            populatePOIs(map, leg.startLocation, category);
            populatePOIs(map, leg.endLocation, category);
        });
    } else {
        getUserLocation().then((loc) => {
            updateMapOverlayStatus(`Populating nearby ${category.toLowerCase()}...`);
            populatePOIs(map, loc, category);
        }).catch(() => {
            populatePOIs(map, { lat: 22.5726, lng: 88.3638 }, category);
        });
    }
}

// ==========================================================================
// 4. MAP ROUTE PLOTTING FALLBACKS
// ==========================================================================
async function fetchAndDrawRoute(promptText) {
    try {
        updateMapOverlayStatus("Calculating Optimal Path...");

        const response = await fetch('/location/get-details-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptText })
        });

        const points = await response.json();

        if (Array.isArray(points) && points.length > 0) {
            drawRoutePolyline(points);
            updateMapOverlayStatus("Tactical Route Plotted");
        } else {
            updateMapOverlayStatus("Geocoding coordinates...");
            fetchSimpleRouteCoords(promptText);
        }
    } catch (e) {
        updateMapOverlayStatus("Route plotting ready");
    }
}

async function fetchSimpleRouteCoords(promptText) {
    try {
        const response = await fetch('/location/get-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptText })
        });

        const data = await response.json();
        if (data.start && data.start.latitude && data.end && data.end.latitude) {
            const points = [
                [data.start.latitude, data.start.longitude],
                [data.end.latitude, data.end.longitude]
            ];
            drawRoutePolyline(points);
        }
    } catch (e) {
        // Silent catch
    }
}

function drawRoutePolyline(points) {
    if (!window.google || !google.maps || !map) return;

    const path = points.map(([lat, lng]) => ({ lat: parseFloat(lat), lng: parseFloat(lng) }));

    if (polylineOverlay) polylineOverlay.setMap(null);
    if (startMarker) startMarker.setMap(null);
    if (endMarker) endMarker.setMap(null);

    const startLoc = path[0];
    const endLoc = path[path.length - 1];

    startMarker = new google.maps.Marker({
        position: startLoc,
        map: map,
        title: "Start Location",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00ff9d",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
        }
    });

    endMarker = new google.maps.Marker({
        position: endLoc,
        map: map,
        title: "Destination",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#00f3ff",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
        }
    });

    polylineOverlay = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: "#00f3ff",
        strokeOpacity: 0.9,
        weight: 5,
        map: map
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds);

    displayRouteStatsWidget(path);
}

function displayRouteStatsWidget(path) {
    const widget = document.getElementById('routeStatsWidget');
    const distEl = document.getElementById('routeDistance');
    const durEl = document.getElementById('routeDuration');

    if (!widget || path.length < 2) return;

    let totalKm = 0;
    for (let i = 0; i < path.length - 1; i++) {
        totalKm += calculateHaversineDistance(path[i], path[i+1]);
    }

    const totalMins = Math.round((totalKm / 65) * 60);

    if (distEl) distEl.textContent = `${totalKm.toFixed(1)} km`;
    if (durEl) durEl.textContent = `~${totalMins} mins`;

    widget.classList.remove('hidden');
}

function calculateHaversineDistance(p1, p2) {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==========================================================================
// 5. ENHANCED ITINERARY RENDERING & MAP ACTIONS
// ==========================================================================
function renderDirectionsItinerary(itineraryList) {
    const displayContainer = document.getElementById('itineraryDisplay');
    if (!displayContainer || !itineraryList.length) return;

    displayContainer.innerHTML = `
        <div class="itinerary-actions-header">
            <span><i class="fa-solid fa-route"></i> Tactical Route (${itineraryList.length} Legs)</span>
            <button class="action-btn-small" id="clearItineraryBtn"><i class="fa-solid fa-trash"></i> Reset</button>
        </div>
    `;

    itineraryList.forEach((leg, index) => {
        const card = document.createElement('div');
        card.className = 'itinerary-card';
        card.style.animationDelay = `${index * 0.08}s`;
        card.innerHTML = `
            <div class="itinerary-card-header">
                <span class="day-badge">Leg ${leg.legNumber}</span>
                <span class="card-location"><i class="fa-solid fa-clock"></i> ${leg.duration} &nbsp;|&nbsp; <i class="fa-solid fa-road"></i> ${leg.distance}</span>
            </div>
            <ul class="activity-list">
                <li class="activity-item">
                    <i class="fa-solid fa-circle-dot" style="color: #00ff9d;"></i>
                    <span><strong>Origin:</strong> ${leg.startAddress}</span>
                </li>
                <li class="activity-item">
                    <i class="fa-solid fa-location-crosshairs" style="color: #00f3ff;"></i>
                    <span><strong>Destination:</strong> ${leg.endAddress}</span>
                </li>
            </ul>
            <div class="card-footer-controls">
                <button class="focus-map-btn" data-lat="${leg.startLocation.lat}" data-lng="${leg.startLocation.lng}">
                    <i class="fa-solid fa-eye"></i> Focus Leg
                </button>
            </div>
        `;
        displayContainer.appendChild(card);
    });

    attachItineraryEventListeners();

    const itineraryTabBtn = document.querySelector('.tab-btn[data-tab="itineraryTab"]');
    if (itineraryTabBtn) itineraryTabBtn.click();
}

function renderItineraryCards(data) {
    const displayContainer = document.getElementById('itineraryDisplay');
    if (!displayContainer) return;

    if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        displayContainer.innerHTML = `
            <div class="empty-itinerary-placeholder">
                <i class="fa-solid fa-compass"></i>
                <h3>No Itinerary Plan Generated</h3>
                <p>Try asking for a travel plan (e.g., "3 day trip for Tokyo").</p>
            </div>
        `;
        return;
    }

    displayContainer.innerHTML = `
        <div class="itinerary-actions-header">
            <span><i class="fa-solid fa-timeline"></i> AI Journey Schedule (${data.itinerary.length} Days)</span>
            <button class="action-btn-small" id="clearItineraryBtn"><i class="fa-solid fa-trash"></i> Clear</button>
        </div>
    `;

    data.itinerary.forEach((dayItem, index) => {
        const card = document.createElement('div');
        card.className = 'itinerary-card';
        card.style.animationDelay = `${index * 0.08}s`;

        const activitiesHtml = (dayItem.activities || []).map(act => `
            <li class="activity-item">
                <i class="fa-solid fa-angle-right"></i>
                <span>${act}</span>
            </li>
        `).join('');

        card.innerHTML = `
            <div class="itinerary-card-header">
                <span class="day-badge">${dayItem.day || `Day ${index + 1}`}</span>
                <span class="card-location"><i class="fa-solid fa-location-dot"></i> ${dayItem.location || 'Excursion'}</span>
            </div>
            <ul class="activity-list">
                ${activitiesHtml}
            </ul>
            <div class="card-footer-controls">
                <button class="focus-map-btn" data-location="${dayItem.location}">
                    <i class="fa-solid fa-crosshairs"></i> Locate
                </button>
            </div>
        `;

        displayContainer.appendChild(card);
    });

    attachItineraryEventListeners();
}

function attachItineraryEventListeners() {
    // Focus location on map
    document.querySelectorAll('.focus-map-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lat = parseFloat(btn.getAttribute('data-lat'));
            const lng = parseFloat(btn.getAttribute('data-lng'));
            const locationName = btn.getAttribute('data-location');

            if (!isNaN(lat) && !isNaN(lng) && map) {
                map.panTo({ lat, lng });
                map.setZoom(14);
            } else if (locationName && map && window.google) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: locationName }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        map.panTo(results[0].geometry.location);
                        map.setZoom(13);
                    }
                });
            }
        });
    });

    // Reset itinerary button
    const clearBtn = document.getElementById('clearItineraryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const displayContainer = document.getElementById('itineraryDisplay');
            displayContainer.innerHTML = `
                <div class="empty-itinerary-placeholder">
                    <i class="fa-solid fa-compass"></i>
                    <h3>Itinerary Cleared</h3>
                    <p>Select a quick query or ask the AI to craft your next route.</p>
                </div>
            `;
        });
    }
}


function handleGenerateItinerary() {
    const lastUserMsg = getLastUserQuery();
    if (lastUserMsg) {
        fetchItineraryPlan(lastUserMsg);
    } else {
        fetchItineraryPlan("3 day itinerary for Paris");
    }
}

function getLastUserQuery() {
    const userMsgs = document.querySelectorAll('.message.user');
    if (userMsgs.length > 0) {
        return userMsgs[userMsgs.length - 1].textContent;
    }
    return "";
}

async function fetchItineraryPlan(promptText) {
    const displayContainer = document.getElementById('itineraryDisplay');
    if (displayContainer) {
        displayContainer.innerHTML = `
            <div class="empty-itinerary-placeholder">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: var(--cyan-primary);"></i>
                <h3>Synthesizing AI Itinerary...</h3>
                <p>Generating day-by-day travel plan and activities...</p>
            </div>
        `;
    }

    try {
        const response = await fetch('/location/get-itinerary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: promptText })
        });

        const data = await response.json();
        renderItineraryCards(data);

        const itineraryTabBtn = document.querySelector('.tab-btn[data-tab="itineraryTab"]');
        if (itineraryTabBtn) itineraryTabBtn.click();

    } catch (e) {
        if (displayContainer) {
            displayContainer.innerHTML = `
                <div class="empty-itinerary-placeholder">
                    <i class="fa-solid fa-circle-exclamation" style="color: #ff0055;"></i>
                    <h3>Unable to generate itinerary</h3>
                    <p>Please check your backend connection or try again.</p>
                </div>
            `;
        }
    }
}

// ==========================================================================
// 6. VOICE RECOGNITION (SPEECH-TO-TEXT)
// ==========================================================================
function toggleVoiceRecognition() {
    const micBtn = document.getElementById('micBtn');
    const transcriptionBar = document.getElementById('transcriptionBar');
    const transcriptionEl = document.getElementById('transcription');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition is not supported in this browser. Please use Google Chrome or Edge.");
        return;
    }

    if (isRecording) {
        isRecording = false;
        if (micBtn) micBtn.classList.remove('recording');
        if (transcriptionBar) transcriptionBar.classList.add('hidden');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        if (micBtn) micBtn.classList.add('recording');
        if (transcriptionBar) transcriptionBar.classList.remove('hidden');
        if (transcriptionEl) transcriptionEl.textContent = "Listening for prompt...";
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        if (transcriptionEl) transcriptionEl.textContent = `"${transcript}"`;

        if (event.results[0].isFinal) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) chatInput.value = transcript;
            setTimeout(() => {
                handleSendChatMessage();
                if (micBtn) micBtn.classList.remove('recording');
                if (transcriptionBar) transcriptionBar.classList.add('hidden');
                isRecording = false;
            }, 800);
        }
    };

    recognition.onerror = (event) => {
        if (transcriptionEl) transcriptionEl.textContent = `Voice Error: ${event.error}`;
        setTimeout(() => {
            if (micBtn) micBtn.classList.remove('recording');
            if (transcriptionBar) transcriptionBar.classList.add('hidden');
            isRecording = false;
        }, 2000);
    };

    recognition.start();
}

// ==========================================================================
// 7. TAB SWITCHING & QUICK PROMPTS
// ==========================================================================
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(targetTab);
            if (targetEl) targetEl.classList.add('active');
        });
    });
}

function setupQuickPrompts() {
    const chips = document.querySelectorAll('.prompt-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            const chatInput = document.getElementById('chatInput');
            if (chatInput && prompt) {
                chatInput.value = prompt;
                handleSendChatMessage();
            }
        });
    });
}

// ==========================================================================
// 8. BACKGROUND CANVAS PARTICLES
// ==========================================================================
function initCanvasParticles() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.floor(width / 25);

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(0, 243, 255, 0.03)";
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 243, 255, ${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// Function to strip unicode emojis and pictographs
function sanitizeCyberText(text) {
    if (!text) return "";
    return text
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
        .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols (stars, cars, etc.)
        .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
}