import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function getResourceTiming(requestUrl) {
  const entries = performance.getEntriesByType("resource");
  let entry = entries.find((item) => item.name === requestUrl);
  if (!entry) {
    entry = entries.filter((item) => item.name.startsWith(requestUrl.split("?")[0])).slice(-1)[0];
  }
  if (!entry) return null;
  return {
    requestStart: entry.requestStart,
    responseStart: entry.responseStart,
    responseEnd: entry.responseEnd,
    ttfb: entry.responseStart - entry.requestStart,
    downloadTime: entry.responseEnd - entry.requestStart,
  };
}

export async function measureNetworkSpeed(testUrl) {
  const requestUrl = `${testUrl}?cb=${Date.now()}`;
  const start = performance.now();
  const response = await fetch(requestUrl, { cache: "no-store" });
  const blob = await response.blob();
  const durationSeconds = (performance.now() - start) / 1000;
  const mbps = (blob.size * 8) / durationSeconds / (1024 * 1024);
  const timing = getResourceTiming(requestUrl);
  return { mbps, bytes: blob.size, timing };
}

export async function loadTextureWithTiming(url) {
  const requestUrl = `${url}?cb=${Date.now()}`;
  const response = await fetch(requestUrl, { cache: "no-store" });
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const texture = new THREE.Texture(bitmap);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const timing = getResourceTiming(requestUrl);
  return { texture, bytes: blob.size, timing, requestUrl };
}
