const STORAGE_KEY = "bandwidth_ar_research_logs";

function classifyNetwork(avgMbps) {
  if (avgMbps < 1) return "low";
  if (avgMbps <= 5) return "medium";
  return "high";
}

function nowIso() {
  return new Date().toISOString();
}

export class MetricsCollector {
  constructor() {
    this.resetSession();
    this.sessions = this.loadSessions();
  }

  resetSession() {
    this.sessionId = null;
    this.events = [];
    this.tapTime = null;
    this.firstTextureTime = null;
    this.resolutionTimes = { low: null, medium: null, high: null };
    this.networkSamples = [];
    this.totalBytes = 0;
    this.textureBytes = 0;
    this.textureCount = 0;
    this.frameTimes = [];
    this.droppedFrames = 0;
    this.rating = null;
    this.finalized = false;
  }

  loadSessions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  saveSessions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
  }

  startSession(sessionId) {
    this.resetSession();
    this.sessionId = sessionId || `local-${Date.now()}`;
    this.events.push({ type: "session_start", timestamp: nowIso() });
  }

  recordTap() {
    this.tapTime = performance.now();
    this.events.push({ type: "tap", timestamp: nowIso() });
  }

  recordNetworkSample(mbps, bytes) {
    this.networkSamples.push(mbps);
    this.totalBytes += bytes || 0;
    this.events.push({ type: "network", timestamp: nowIso(), mbps });
  }

  recordTextureApplied({ resolution, bytes, timing }) {
    const now = performance.now();
    if (!this.firstTextureTime) {
      this.firstTextureTime = now;
    }
    if (!this.resolutionTimes[resolution]) {
      this.resolutionTimes[resolution] = now;
    }
    this.textureBytes += bytes || 0;
    this.textureCount += 1;
    this.totalBytes += bytes || 0;
    this.events.push({
      type: "texture",
      timestamp: nowIso(),
      resolution,
      bytes,
      timing,
    });
  }

  recordFrame(timestamp) {
    if (this.frameTimes.length) {
      const prev = this.frameTimes[this.frameTimes.length - 1];
      const delta = timestamp - prev;
      if (delta > 16) {
        this.droppedFrames += 1;
      }
    }
    this.frameTimes.push(timestamp);
  }

  recordRating(rating) {
    this.rating = rating;
    this.events.push({ type: "rating", timestamp: nowIso(), rating });
  }

  endSession() {
    this.events.push({ type: "session_end", timestamp: nowIso() });
  }

  finalizeSession() {
    if (this.finalized) return null;
    if (!this.sessionId) return null;
    const avgNetworkSpeed =
      this.networkSamples.reduce((sum, v) => sum + v, 0) /
      Math.max(this.networkSamples.length, 1);
    const networkType = classifyNetwork(avgNetworkSpeed);
    const latency =
      this.tapTime && this.firstTextureTime ? this.firstTextureTime - this.tapTime : null;
    const firstRenderTime = latency;
    const lowTime = this.resolutionTimes.low;
    const mediumTime = this.resolutionTimes.medium;
    const highTime = this.resolutionTimes.high;
    const upgradeLowToMedium =
      lowTime && mediumTime ? mediumTime - lowTime : null;
    const upgradeMediumToHigh =
      mediumTime && highTime ? highTime - mediumTime : null;

    const frameDeltas = [];
    for (let i = 1; i < this.frameTimes.length; i += 1) {
      frameDeltas.push(this.frameTimes[i] - this.frameTimes[i - 1]);
    }
    const fpsValues = frameDeltas.map((d) => (d > 0 ? 1000 / d : 0));
    const fpsAvg =
      fpsValues.reduce((sum, v) => sum + v, 0) / Math.max(fpsValues.length, 1);
    const fpsMin = fpsValues.length ? Math.min(...fpsValues) : 0;
    const fpsMax = fpsValues.length ? Math.max(...fpsValues) : 0;
    const droppedFrames = this.droppedFrames;
    const droppedPercent =
      this.frameTimes.length > 1
        ? (droppedFrames / (this.frameTimes.length - 1)) * 100
        : 0;

    const summary = {
      sessionId: this.sessionId,
      createdAt: nowIso(),
      avgNetworkSpeed,
      networkType,
      latency,
      firstRenderTime,
      bandwidthMB: this.totalBytes / (1024 * 1024),
      fpsAvg,
      fpsMin,
      fpsMax,
      droppedFrames,
      droppedPercent,
      textureBytesMB: this.textureBytes / (1024 * 1024),
      textureCount: this.textureCount,
      upgrades: {
        lowToMedium: upgradeLowToMedium,
        mediumToHigh: upgradeMediumToHigh,
      },
      MOS: this.rating,
      events: this.events,
    };

    this.sessions.push(summary);
    this.saveSessions();
    this.finalized = true;
    return summary;
  }

  isFinalized() {
    return this.finalized;
  }

  hasRating() {
    return this.rating !== null && this.rating !== undefined;
  }

  getSessions() {
    return this.sessions;
  }

  toJSON() {
    return JSON.stringify(this.sessions, null, 2);
  }

  toCSV() {
    const headers = [
      "sessionId",
      "createdAt",
      "avgNetworkSpeed",
      "networkType",
      "latency",
      "firstRenderTime",
      "bandwidthMB",
      "fpsAvg",
      "fpsMin",
      "fpsMax",
      "droppedFrames",
      "droppedPercent",
      "textureBytesMB",
      "textureCount",
      "upgradeLowToMedium",
      "upgradeMediumToHigh",
      "MOS",
    ];

    const rows = [headers.join(",")];
    for (const session of this.sessions) {
      rows.push(
        [
          session.sessionId,
          session.createdAt,
          session.avgNetworkSpeed,
          session.networkType,
          session.latency,
          session.firstRenderTime,
          session.bandwidthMB,
          session.fpsAvg,
          session.fpsMin,
          session.fpsMax,
          session.droppedFrames,
          session.droppedPercent,
          session.textureBytesMB,
          session.textureCount,
          session.upgrades?.lowToMedium ?? "",
          session.upgrades?.mediumToHigh ?? "",
          session.MOS ?? "",
        ].join(",")
      );
    }
    return rows.join("\n");
  }
}
