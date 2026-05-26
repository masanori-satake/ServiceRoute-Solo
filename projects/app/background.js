/**
 * ServiceRoute-Solo: background.js
 * Centralized dispatcher using chrome.alarms for adaptive polling.
 */

const ALARM_NAME = "service-checker-alarm";

const INTERVALS = {
  NORMAL: 15, // 15 minutes
  FAILURE_INITIAL: 2, // 2 minutes (within 10m of failure)
  FAILURE_LONG: 30, // 30 minutes (backoff)
  RATE_LIMITED: 30, // 30 minutes (turtle mode)
  OFF_HOURS: 0, // Stop polling
};

/**
 * Initialize alarms and listeners
 */
chrome.runtime.onInstalled.addListener(async () => {
  const { services } = await chrome.storage.local.get("services");
  if (!services) {
    await chrome.storage.local.set({
      services: [],
      isEnabled: true,
      checkInterval: INTERVALS.NORMAL,
      businessHours: {
        start: "00:00",
        end: "00:00",
        weekendsOff: false,
      },
    });
  }
  setupAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarm();
});

/**
 * Handle Idle state changes
 */
chrome.idle.onStateChanged.addListener((newState) => {
  console.log(`Idle state changed to: ${newState}`);
  if (newState === "locked" || newState === "idle") {
    chrome.alarms.clear(ALARM_NAME);
  } else {
    setupAlarm();
  }
});

/**
 * Handle messages from Popup or Options
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RECHECK_NOW") {
    dispatchChecks().then(() => sendResponse({ success: true }));
    return true; // async response
  }
  if (message.type === "SETTINGS_UPDATED") {
    // Re-setup alarm and trigger immediate check when settings change (e.g. service added)
    // Run sequentially to avoid race condition on storage and alarm state
    setupAlarm()
      .then(dispatchChecks)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Error updating settings and dispatching checks:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * Setup or update the alarm based on the current context
 */
async function setupAlarm() {
  const settings = await chrome.storage.local.get([
    "checkInterval",
    "isEnabled",
  ]);
  const interval = settings.checkInterval || INTERVALS.NORMAL;

  // Clear existing
  await chrome.alarms.clear(ALARM_NAME);

  if (settings.isEnabled !== false) {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: interval,
    });
    console.log(`Alarm set for ${interval} minutes.`);
  }
}

/**
 * Alarm listener
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    dispatchChecks();
  }
});

/**
 * Core dispatcher logic
 */
async function dispatchChecks() {
  const isOffHours = await checkOffHours();
  if (isOffHours) {
    console.log("Off-hours: skipping checks.");
    updateStateForAll("💤");
    return;
  }

  const { services = [] } = await chrome.storage.local.get("services");
  const updatedServices = await Promise.all(
    services.map((service) => checkService(service)),
  );

  await chrome.storage.local.set({ services: updatedServices });
  await updateGlobalInterval(updatedServices);
}

/**
 * Fetch utility to check service status
 */
async function checkService(service) {
  const { url, loginKeyword } = service;
  let newState = { ...service };

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-cache",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (
      response.redirected &&
      loginKeyword &&
      response.url.includes(loginKeyword)
    ) {
      newState.status = "🟡";
      newState.message = "要ログイン（CAPTCHA等）";
      newState.failureSince = null;
    } else if (response.status >= 200 && response.status < 300) {
      newState.status = "🟢";
      newState.message = "正常稼働中";
      newState.failureSince = null;
    } else if (response.status === 401 || response.status === 403) {
      newState.status = "🚫";
      newState.message = "認証・権限エラー";
      newState.failureSince = newState.failureSince || Date.now();
    } else if (response.status === 429) {
      newState.status = "🐢";
      newState.message = "接続一時制限中";
      newState.failureSince = newState.failureSince || Date.now();
    } else if (response.status >= 500) {
      newState.status = "❌";
      newState.message = "サーバー障害";
      newState.failureSince = newState.failureSince || Date.now();
    } else {
      newState.status = "⚠️";
      newState.message = `HTTP ${response.status}`;
      newState.failureSince = newState.failureSince || Date.now();
    }
  } catch (error) {
    newState.status = "❌";
    newState.message = "ネットワークエラー（プロキシ等）";
    newState.failureSince = newState.failureSince || Date.now();
  }

  newState.lastCheck = Date.now();
  return newState;
}

/**
 * Update the global polling interval based on the worst status
 */
async function updateGlobalInterval(services) {
  let minInterval = INTERVALS.NORMAL;

  for (const s of services) {
    if (s.status === "❌" || s.status === "⚠️") {
      const failureDuration = Date.now() - (s.failureSince || Date.now());
      const isInitial = failureDuration < 10 * 60 * 1000; // 10 minutes
      minInterval = Math.min(
        minInterval,
        isInitial ? INTERVALS.FAILURE_INITIAL : INTERVALS.FAILURE_LONG,
      );
    } else if (s.status === "🐢") {
      minInterval = Math.max(minInterval, INTERVALS.RATE_LIMITED);
    }
  }

  const { checkInterval } = await chrome.storage.local.get("checkInterval");
  if (checkInterval !== minInterval) {
    await chrome.storage.local.set({ checkInterval: minInterval });
    await setupAlarm();
  }
}

/**
 * Check if current time is within business hours
 */
async function checkOffHours() {
  const { businessHours } = await chrome.storage.local.get("businessHours");
  if (!businessHours) return false;

  const now = new Date();
  const day = now.getDay();

  if (businessHours.weekendsOff && (day === 0 || day === 6)) {
    return true;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = businessHours.start.split(":").map(Number);
  const [endH, endM] = businessHours.end.split(":").map(Number);

  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  return startTime < endTime
    ? currentTime < startTime || currentTime >= endTime
    : currentTime < startTime && currentTime >= endTime;
}

/**
 * Placeholder for updating state
 */
async function updateStateForAll(status) {
  const { services = [] } = await chrome.storage.local.get("services");
  const updatedServices = services.map((s) => ({ ...s, status }));
  await chrome.storage.local.set({ services: updatedServices });
}
