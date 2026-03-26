import { MetricsCollector } from "./metrics.js";
import { measureNetworkSpeed, loadTextureWithTiming } from "./network.js";
import { createRenderer } from "./renderer.js";

const ui = {
  speed: document.getElementById("speed"),
  resolution: document.getElementById("resolution"),
  start: document.getElementById("start-ar"),
  download: document.getElementById("download-logs"),
  status: document.getElementById("status"),
  prompt: document.getElementById("prompt"),
  ratingModal: document.getElementById("rating-modal"),
  ratingButtons: document.getElementById("rating-buttons"),
  closeRating: document.getElementById("close-rating"),
};

const TEXTURES = {
  low: "/tiles/tile-1.jpg",
  medium: "/tiles/tile-2.jpg",
  high: "/tiles/tile-3.jpg",
};

const SPEED_TEST_URL = "./speed-test.txt";
const SPEED_INTERVAL_MS = 3000;

const sessionState = {
  session: null,
  tilePlaced: false,
  currentResolution: null,
  lastClass: "low",
  stableCount: 0,
  speedTimer: null,
  sessionEnded: false,
};

const metrics = new MetricsCollector();
let rendererBundle = null;

function setStatus(message, isError = false) {
  ui.status.textContent = message;
  ui.status.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function bandwidthClass(mbps) {
  if (mbps < 1) return "low";
  if (mbps <= 5) return "medium";
  return "high";
}

function classRank(level) {
  if (level === "low") return 0;
  if (level === "medium") return 1;
  return 2;
}

async function setResolution(resolution) {
  if (sessionState.currentResolution === resolution) return;
  sessionState.currentResolution = resolution;
  ui.resolution.textContent = resolution;
  const { texture, bytes, timing } = await loadTextureWithTiming(TEXTURES[resolution]);
  rendererBundle.applyTexture(texture);
  metrics.recordTextureApplied({ resolution, bytes, timing });
}

async function updateResolutionFromSpeed() {
  if (!sessionState.tilePlaced) return;
  try {
    const result = await measureNetworkSpeed(SPEED_TEST_URL);
    ui.speed.textContent = `${result.mbps.toFixed(2)} Mbps`;
    metrics.recordNetworkSample(result.mbps, result.bytes);

    const currentClass = bandwidthClass(result.mbps);
    if (currentClass === sessionState.lastClass) {
      sessionState.stableCount += 1;
    } else {
      sessionState.lastClass = currentClass;
      sessionState.stableCount = 1;
    }

    const currentRank = classRank(sessionState.currentResolution || "low");
    const desiredRank = classRank(currentClass);

    if (desiredRank < currentRank) {
      await setResolution(currentClass);
    } else if (desiredRank > currentRank && sessionState.stableCount >= 2) {
      await setResolution(currentClass);
    }
  } catch (error) {
    setStatus("Network test failed. Retrying...", true);
  }
}

function onSelect(reticle) {
  if (!reticle.visible) return;
  rendererBundle.tileGroup.position.setFromMatrixPosition(reticle.matrix);
  rendererBundle.tileGroup.quaternion.setFromRotationMatrix(reticle.matrix);
  sessionState.tilePlaced = true;
  ui.prompt.textContent = "Tile placed. Bandwidth adaptation active.";
  metrics.recordTap();
  setResolution("low");
}

async function startAR() {
  if (!window.isSecureContext) {
    setStatus("WebXR requires HTTPS or localhost. Open this page over HTTPS.", true);
    return;
  }

  if (!navigator.xr) {
    setStatus("WebXR not available in this browser. Try Chrome on Android.", true);
    return;
  }

  const supported = await navigator.xr.isSessionSupported("immersive-ar");
  if (!supported) {
    setStatus("Immersive AR not available. Try Chrome on Android.", true);
    return;
  }

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "local-floor"],
    domOverlay: { root: document.body },
  });

  sessionState.session = session;
  sessionState.sessionEnded = false;
  sessionState.tilePlaced = false;
  sessionState.currentResolution = null;
  sessionState.lastClass = "low";
  sessionState.stableCount = 0;

  metrics.startSession(session.id || `local-${Date.now()}`);

  rendererBundle.renderer.xr.setSession(session);
  rendererBundle.renderer.setAnimationLoop(rendererBundle.render);

  session.addEventListener("end", () => {
    rendererBundle.renderer.setAnimationLoop(null);
    ui.prompt.textContent = "Session ended.";
    clearInterval(sessionState.speedTimer);
    metrics.endSession();
    sessionState.sessionEnded = true;
    ui.ratingModal.hidden = false;
    setTimeout(() => {
      if (ui.ratingModal.hidden && !metrics.isFinalized()) {
        metrics.finalizeSession();
      }
    }, 15000);
  });

  ui.prompt.textContent = "Scan the floor and tap to place the tile.";
  setStatus("AR session active.");

  if (!sessionState.speedTimer) {
    sessionState.speedTimer = setInterval(updateResolutionFromSpeed, SPEED_INTERVAL_MS);
  }
}

async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  const canDownload = "download" in anchor;

  if (canDownload) {
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return { ok: true, method: "download" };
  }

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: blob.type || "application/octet-stream" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Bandwidth AR Research Logs",
        });
        URL.revokeObjectURL(url);
        return { ok: true, method: "share" };
      } catch (error) {
        // fall through to opening a new tab
      }
    }
  }

  // Final fallback: open in a new tab so user can Save/Share manually.
  window.open(url, "_blank");
  return { ok: false, method: "new-tab" };
}

function setupRating() {
  ui.ratingButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-rating]");
    if (!button) return;
    const rating = Number(button.dataset.rating);
    metrics.recordRating(rating);
    metrics.finalizeSession();
    ui.ratingModal.hidden = true;
  });

  ui.closeRating.addEventListener("click", () => {
    metrics.finalizeSession();
    ui.ratingModal.hidden = true;
  });
}

function init() {
  if (performance && performance.setResourceTimingBufferSize) {
    performance.setResourceTimingBufferSize(500);
    performance.clearResourceTimings();
  }
  rendererBundle = createRenderer({
    onSelect,
    onFrame: (timestamp) => metrics.recordFrame(timestamp),
  });

  setupRating();

  ui.start.addEventListener("click", startAR);
  ui.download.addEventListener("click", async () => {
    const jsonResult = await downloadBlob(
      new Blob([metrics.toJSON()], { type: "application/json" }),
      `bandwidth-ar-research-${Date.now()}.json`
    );
    const csvResult = await downloadBlob(
      new Blob([metrics.toCSV()], { type: "text/csv" }),
      `bandwidth-ar-research-${Date.now()}.csv`
    );
    const ok =
      (jsonResult?.ok && csvResult?.ok) ||
      jsonResult?.method === "share" ||
      csvResult?.method === "share";

    if (ok) {
      setStatus("Research logs saved. Check Downloads or Share sheet.", false);
      return;
    }

    setStatus("Logs opened in new tabs. Use Share/Save.", false);
  });

  setStatus("Ready. Tap Start AR.");
}

init();
