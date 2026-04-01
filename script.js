import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEsOE_AaDfQhmfdknHCP6afmBG8BsRJdc",
  authDomain: "go-kart-board.firebaseapp.com",
  projectId: "go-kart-board",
  storageBucket: "go-kart-board.firebasestorage.app",
  messagingSenderId: "296217503831",
  appId: "1:296217503831:web:260e07ccc92d3447d31b12",
  measurementId: "G-4ENXPS28FP",
  databaseURL: "https://go-kart-board-default-rtdb.europe-west1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* === KONFIGURATION === */
const defaultSettings = {
  eventName: "Finale 2026",
  eventTitle: "Go-Kart Grand Prix",
  trackName: "Kartbahn München",
  totalLaps: 25
};

const defaultDrivers = [
  { id: 1, name: "Max Weber", team: "Schmidts Racing", kart: "#44", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 2, name: "Sophie Mueller", team: "Alpinestars", kart: "#77", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 3, name: "Leon Schmidt", team: "Schmidts Racing", kart: "#33", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 4, name: "Anna Fischer", team: "Speedy Gonzales", kart: "#11", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 5, name: "Tim Becker", team: "M Speed", kart: "#55", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 6, name: "Julia Wagner", team: "Red Team", kart: "#22", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 7, name: "David Klein", team: "Blue Thunder", kart: "#88", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false },
  { id: 8, name: "Emma Hoffmann", team: "Speedy Gonzales", kart: "#99", photoDataUrl: null, lastLapMs: 0, bestLapMs: 0, gapMs: 0, laps: 0, status: "pit", lapStartMs: null, isRunning: false }
];

let raceSettings = { ...defaultSettings };
let drivers = JSON.parse(JSON.stringify(defaultDrivers));

function pushToCloud() {
    set(ref(db, '/'), {
        raceSettings: raceSettings,
        drivers: drivers
    });
}

onValue(ref(db, '/'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.raceSettings) raceSettings = data.raceSettings;
        if (data.drivers) drivers = data.drivers;
        updateState();
    } else {
        pushToCloud();
    }
});

/* === DOM ELEMENTE === */
const elements = {
  clock: document.querySelector("#current-time"),
  leaderName: document.querySelector("#leader-name"),
  leaderKart: document.querySelector("#leader-kart"),
  raceProgress: document.querySelector("#race-progress"),
  eventNameEl: document.querySelector("#event-name"),
  eventTitleEl: document.querySelector("#event-title"),
  topDrivers: document.querySelector("#top-drivers"),
  timingRows: document.querySelector("#timing-rows"),
  fastestLap: document.querySelector("#fastest-lap"),
  fastestDriver: document.querySelector("#fastest-driver"),
  averageLap: document.querySelector("#average-lap"),
  statusProgress: document.querySelector("#status-progress"),
  adminToggle: document.querySelector("#admin-toggle"),
  settingsToggle: document.querySelector("#settings-toggle"),
  btnStartAll: document.querySelector("#btn-start-all"),
  btnStopAll: document.querySelector("#btn-stop-all"),
  btnResetAll: document.querySelector("#btn-reset-all"),
  // Edit Modal Elements
  driverEditModal: document.querySelector("#driver-edit-modal"),
  closeModalBtn: document.querySelector("#close-modal-btn"),
  editName: document.querySelector("#edit-name"),
  editTeam: document.querySelector("#edit-team"),
  editTeamColor: document.querySelector("#edit-team-color"),
  editKart: document.querySelector("#edit-kart"),
  editPhotoFile: document.querySelector("#edit-photo-file"),
  editPhotoPreview: document.querySelector("#edit-photo-preview"),
  saveDriverBtn: document.querySelector("#save-driver-btn"),
  editDriverId: document.querySelector("#edit-driver-id"),
  // Settings Modal Elements
  settingsModal: document.querySelector("#settings-modal"),
  closeSettingsBtn: document.querySelector("#close-settings-btn"),
  setEventName: document.querySelector("#set-event-name"),
  setEventTitle: document.querySelector("#set-event-title"),
  setTrackName: document.querySelector("#set-track-name"),
  setTotalLaps: document.querySelector("#set-total-laps"),
  saveSettingsBtn: document.querySelector("#save-settings-btn")
};

let podiumPage = 0;

/* === HILFSFUNKTIONEN === */
function formatClock(date) {
  return date.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatLapTime(totalMilliseconds) {
  if (totalMilliseconds === 0) return "-";
  const safeMilliseconds = Math.max(0, Math.round(totalMilliseconds));
  const minutes = Math.floor(safeMilliseconds / 60000);
  const seconds = Math.floor((safeMilliseconds % 60000) / 1000);
  const millis = safeMilliseconds % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function getInitials(name) {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function getStatusLabel(status) {
  if (status === "pit") return "In der Box";
  if (status === "finished") return "Im Ziel";
  return "Auf Strecke";
}

function getPodiumTier(position) {
  if (position === 1) return "var(--gold)";
  if (position === 2) return "var(--silver)";
  if (position === 3) return "var(--bronze)";
  return "rgba(255, 255, 255, 0.15)";
}

/* === BERECHNUNGEN (STATE) === */
function sortDrivers() {
  drivers.sort((a, b) => {
    // 1. Meiste Runden
    if (b.laps !== a.laps) return b.laps - a.laps;
    // 2. Kürzeste Gesamtzeit oder Beste Runde als Fallback für Gleichstand bei Runden
    if (a.bestLapMs === 0 && b.bestLapMs !== 0) return 1;
    if (b.bestLapMs === 0 && a.bestLapMs !== 0) return -1;
    return a.bestLapMs - b.bestLapMs; 
  });
  
  // Gaps berechnen basierend auf bestem Fahrer (Index 0 nach Sort)
  const bestDriver = drivers[0];
  drivers.forEach((d, i) => {
      d.position = i + 1;
      if (i === 0 || d.bestLapMs === 0 || bestDriver.bestLapMs === 0) {
          d.gapMs = 0;
      } else {
          d.gapMs = d.bestLapMs - bestDriver.bestLapMs;
      }
  });
}

function computeAverageLap() {
  const driversWithTime = drivers.filter(d => d.lastLapMs > 0);
  if (driversWithTime.length === 0) return "-";
  const sum = driversWithTime.reduce((acc, d) => acc + d.lastLapMs, 0);
  return formatLapTime(sum / driversWithTime.length);
}

function getFastestDriver() {
  const driversWithTime = drivers.filter(d => d.bestLapMs > 0);
  if (driversWithTime.length === 0) return null;
  return driversWithTime.reduce((best, d) => d.bestLapMs < best.bestLapMs ? d : best, driversWithTime[0]);
}

/* === AKTIONEN === */
function startDriver(id) {
    const driver = drivers.find(d => d.id === id);
    if (!driver || driver.laps >= raceSettings.totalLaps) return;
    
    // Wenn er schon läuft, ist es eine "Neue Runde" - wir stoppen die aktuelle und starten eine neue
    if (driver.isRunning && driver.lapStartMs) {
        const lapTime = Date.now() - driver.lapStartMs;
        driver.lastLapMs = lapTime;
        if (driver.bestLapMs === 0 || lapTime < driver.bestLapMs) {
            driver.bestLapMs = lapTime;
        }
        driver.laps++;
    }
    
    if (driver.laps >= raceSettings.totalLaps) {
        driver.isRunning = false;
        driver.status = "finished";
        driver.lapStartMs = null;
    } else {
        driver.isRunning = true;
        driver.status = "running";
        driver.lapStartMs = Date.now();
    }
}

function stopDriver(id) {
    const driver = drivers.find(d => d.id === id);
    if (!driver || !driver.isRunning) return;
    
    driver.isRunning = false;
    driver.status = "pit";
    driver.lapStartMs = null;
}

function resetAll() {
    drivers.forEach(d => {
        d.lastLapMs = 0;
        d.bestLapMs = 0;
        d.gapMs = 0;
        d.laps = 0;
        d.status = "pit";
        d.lapStartMs = null;
        d.isRunning = false;
        d.position = d.id;
    });
}

function updateState() {
  sortDrivers();
  renderBoard();
}

// Window Globals fürs onclick im HTML freigeben
window.startDriver = startDriver;
window.stopDriver = stopDriver;

/* === RENDER LOGIK === */
function renderTopDrivers() {
  const startIdx = podiumPage * 3;
  const chunk = drivers.slice(startIdx, startIdx + 3);
  
  elements.topDrivers.innerHTML = chunk.map((driver) => `
    <article class="podium-card" style="--tier:${getPodiumTier(driver.position)}">
      <div class="podium-top">
        <div class="podium-header-info">
          <span class="podium-tag">P${driver.position}</span>
          ${driver.team && driver.team !== "-" ? `<span class="podium-team"><span class="team-color-dot" style="background-color: ${driver.teamColor || 'transparent'}"></span>${driver.team}</span>` : ""}
        </div>
        
        <div class="podium-profile">
            <div class="podium-avatar" style="background-image: url('${driver.photoDataUrl || ''}'); border-color: ${driver.teamColor || 'var(--tier)'}">
              ${!driver.photoDataUrl ? getInitials(driver.name) : ''}
            </div>
            <div>
              <h4>${driver.name}</h4>
              <span class="podium-kart">${driver.kart}</span>
            </div>
        </div>
      </div>
      <div class="podium-stats">
        <div class="stat-line">
          <span>Letzte Runde</span>
          <span class="live-lap-display" data-id="${driver.id}">${
            driver.isRunning ? formatLapTime(Date.now() - driver.lapStartMs) : formatLapTime(driver.lastLapMs)
          }</span>
        </div>
        <div class="stat-line">
          <span>Beste Runde</span>
          <span class="best-lap">${formatLapTime(driver.bestLapMs)}</span>
        </div>
        <div class="stat-line">
          <span>Abstand</span>
          <span>${driver.gapMs === 0 ? "-" : "+" + (driver.gapMs/1000).toFixed(3)}</span>
        </div>
      </div>
    </article>
  `).join("");
}

function renderTimingTable() {
  elements.timingRows.innerHTML = drivers.map((driver) => {
    const topClass = driver.position <= 3 ? `is-top-${driver.position}` : "";
    
    const currentDisplayTime = driver.isRunning ? formatLapTime(Date.now() - driver.lapStartMs) : formatLapTime(driver.lastLapMs);

    return `
      <div class="timing-row timing-row--body ${topClass}">
        <div class="position-badge">
          <span class="position-number">${driver.position}</span>
        </div>
        <div class="driver-meta">
          <div class="driver-avatar" style="background-image: url('${driver.photoDataUrl || ''}')">
             ${!driver.photoDataUrl ? getInitials(driver.name) : ''}
          </div>
          <div>
            <span class="driver-name">${driver.name}</span>
            <span class="driver-status status-${driver.status}">${getStatusLabel(driver.status)}</span>
          </div>
        </div>
        <div class="driver-team-cell" title="${driver.team}">
          <span class="team-color-bar" style="background-color: ${driver.teamColor || 'transparent'}"></span>
          <span>${driver.team}</span>
        </div>
        <span class="kart-id">${driver.kart}</span>
        <span class="lap-time live-lap-display" data-id="${driver.id}">${currentDisplayTime}</span>
        <span class="lap-time best-lap">${formatLapTime(driver.bestLapMs)}</span>
        <span class="gap-value">${driver.gapMs === 0 ? "-" : "+" + (driver.gapMs/1000).toFixed(3)}</span>
        <span class="laps-value">${driver.laps}</span>
        
        <div class="cell-admin-actions hide-when-not-admin">
            <button class="admin-action-btn sm" onclick="window.openEditModal(${driver.id})">Bearbeiten</button>
            <button class="admin-action-btn sm safe" onclick="window.startDriverCloud(${driver.id})">${driver.isRunning ? 'Runde!' : 'Start'}</button>
            <button class="admin-action-btn sm danger" onclick="window.stopDriverCloud(${driver.id})">Stopp</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderSummary() {
  const leader = drivers[0];
  const fastestDriver = getFastestDriver();

  elements.eventNameEl.textContent = raceSettings.eventName;
  elements.eventTitleEl.textContent = raceSettings.eventTitle;
  elements.leaderName.textContent = leader.name;
  elements.leaderKart.textContent = leader.kart;
  elements.raceProgress.textContent = `${raceSettings.trackName} - Runde ${leader.laps}/${raceSettings.totalLaps}`;
  
  if (fastestDriver) {
      elements.fastestLap.textContent = formatLapTime(fastestDriver.bestLapMs);
      elements.fastestDriver.textContent = fastestDriver.name;
  } else {
      elements.fastestLap.textContent = "-";
      elements.fastestDriver.textContent = "-";
  }
  
  elements.averageLap.textContent = computeAverageLap();
  elements.statusProgress.textContent = `Runde ${leader.laps} von ${raceSettings.totalLaps}`;
}

function renderBoard() {
  renderTopDrivers();
  renderTimingTable();
  renderSummary();
}

/* === LOOP & EVENTS === */
elements.adminToggle.addEventListener("click", () => {
    document.body.classList.toggle("admin-active");
});

elements.btnStartAll.addEventListener("click", () => {
    drivers.forEach(d => {
        if (!d.isRunning && d.laps < raceSettings.totalLaps) startDriver(d.id);
    });
    pushToCloud();
});

elements.btnStopAll.addEventListener("click", () => {
    drivers.forEach(d => {
        if (d.isRunning) stopDriver(d.id);
    });
    pushToCloud();
});

elements.btnResetAll.addEventListener("click", () => {
    if(confirm("Alle Zeiten und Runden wirklich zurücksetzen?")) {
        resetAll();
        pushToCloud();
        renderBoard(); // Lokales Zwischenrendern beibehalten
    }
});

function tickFast() {
    document.querySelectorAll('.live-lap-display').forEach(el => {
        const id = parseInt(el.getAttribute('data-id'));
        const driver = drivers.find(d => d.id === id);
        if (driver && driver.isRunning && driver.lapStartMs) {
            el.textContent = formatLapTime(Date.now() - driver.lapStartMs);
        }
    });
}

function tickClock() {
  elements.clock.textContent = formatClock(new Date());
}

/* === MODAL & EDIT LOGIC === */
function openEditModal(id) {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    
    elements.editDriverId.value = driver.id;
    elements.editName.value = driver.name;
    elements.editTeam.value = driver.team || "";
    elements.editTeamColor.value = driver.teamColor || "#ffffff";
    elements.editKart.value = driver.kart;
    
    if (driver.photoDataUrl) {
        elements.editPhotoPreview.style.backgroundImage = `url('${driver.photoDataUrl}')`;
        elements.editPhotoPreview.textContent = "";
    } else {
        elements.editPhotoPreview.style.backgroundImage = "none";
        elements.editPhotoPreview.textContent = getInitials(driver.name);
    }
    
    // Clear file input
    elements.editPhotoFile.value = "";
    
    elements.driverEditModal.classList.remove("hide-modal");
}

function closeEditModal() {
    elements.driverEditModal.classList.add("hide-modal");
}

elements.closeModalBtn.addEventListener("click", closeEditModal);

elements.editPhotoFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        // Resize image to max 256x256 to save localStorage space
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const maxSize = 256;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
            } else if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            elements.editPhotoPreview.style.backgroundImage = `url('${dataUrl}')`;
            elements.editPhotoPreview.dataset.tempUrl = dataUrl;
            elements.editPhotoPreview.innerHTML = ``;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

elements.saveDriverBtn.addEventListener("click", () => {
    const id = parseInt(elements.editDriverId.value);
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    
    driver.name = elements.editName.value || "Unbekannt";
    driver.team = elements.editTeam.value || "-";
    driver.teamColor = elements.editTeamColor.value;
    driver.kart = elements.editKart.value || "-";
    
    if (elements.editPhotoPreview.dataset.tempUrl) {
        driver.photoDataUrl = elements.editPhotoPreview.dataset.tempUrl;
    }
    
    closeEditModal();
    pushToCloud();
});

window.openEditModal = openEditModal;
window.startDriverCloud = function(id) {
    startDriver(id);
    pushToCloud();
};
window.stopDriverCloud = function(id) {
    stopDriver(id);
    pushToCloud();
};

/* === SETTINGS LOGIC === */
elements.settingsToggle.addEventListener("click", () => {
    elements.setEventName.value = raceSettings.eventName;
    elements.setEventTitle.value = raceSettings.eventTitle;
    elements.setTrackName.value = raceSettings.trackName;
    elements.setTotalLaps.value = raceSettings.totalLaps;
    elements.settingsModal.classList.remove("hide-modal");
});

elements.closeSettingsBtn.addEventListener("click", () => {
    elements.settingsModal.classList.add("hide-modal");
});

elements.saveSettingsBtn.addEventListener("click", () => {
    raceSettings.eventName = elements.setEventName.value;
    raceSettings.eventTitle = elements.setEventTitle.value;
    raceSettings.trackName = elements.setTrackName.value;
    raceSettings.totalLaps = parseInt(elements.setTotalLaps.value) || 25;
    
    elements.settingsModal.classList.add("hide-modal");
    pushToCloud();
});

/* Podium Auto-Rotation - wechselt alle 5 Sekunden */
setInterval(() => {
    podiumPage++;
    if (podiumPage * 3 >= drivers.length) podiumPage = 0;
    renderTopDrivers();
}, 6000);

/* Initialisieren */
sortDrivers();
renderBoard();

window.setInterval(tickClock, 1000);
window.setInterval(tickFast, 72); // flüssige millis updates
