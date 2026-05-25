/**
 * ServiceRoute-Solo: popup.js
 * Visualizes service status and handles manual re-check.
 */

document.addEventListener("DOMContentLoaded", async () => {
  await renderServices();

  document.getElementById("open-settings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  const recheckBtn = document.getElementById("recheck-btn");
  const recheckIcon = document.getElementById("recheck-icon");

  recheckBtn.addEventListener("click", async () => {
    if (recheckBtn.disabled) return;

    recheckBtn.disabled = true;
    recheckIcon.classList.add("spinning");

    chrome.runtime.sendMessage({ type: "RECHECK_NOW" }, async (response) => {
      await renderServices();
      recheckBtn.disabled = false;
      recheckIcon.classList.remove("spinning");
    });
  });
});

async function renderServices() {
  const { services = [] } = await chrome.storage.local.get("services");
  const container = document.getElementById("service-container");

  if (services.length === 0) {
    container.innerHTML =
      '<div class="empty-state">サービスが登録されていません。<br>設定から追加してください。</div>';
    return;
  }

  container.innerHTML = "";
  services.forEach((service) => {
    const card = document.createElement("div");
    card.className = "service-card";

    const duration = service.failureSince
      ? calculateDuration(service.failureSince)
      : "";
    const lastCheckTime = service.lastCheck
      ? new Date(service.lastCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : "--:--:--";

    const statusInfo = getStatusSymbol(service.status);

    card.innerHTML = `
      <div class="status-icon-container">
        <span class="material-symbols-outlined ${statusInfo.className}">${statusInfo.symbol}</span>
      </div>
      <div class="service-info">
        <span class="service-name">${escapeHtml(service.name)}</span>
        <span class="service-status-msg">
          ${escapeHtml(service.message)}
          ${duration ? `<span class="failure-duration">(${duration}前から)</span>` : ""}
        </span>
      </div>
      <div class="last-check-container">
        <span class="last-check-time">${lastCheckTime}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Maps emoji status to M3 Symbol and color class
 */
function getStatusSymbol(statusEmoji) {
  switch (statusEmoji) {
    case "🟢":
      return { symbol: "check_circle", className: "status-ok" };
    case "🟡":
      return { symbol: "login", className: "status-warning" };
    case "⚠️":
      return { symbol: "warning", className: "status-warning" };
    case "❌":
      return { symbol: "error", className: "status-error" };
    case "🚫":
      return { symbol: "no_accounts", className: "status-auth" };
    case "🐢":
      return { symbol: "speed", className: "status-slow" };
    case "💤":
      return { symbol: "bedtime", className: "status-sleep" };
    default:
      return { symbol: "help", className: "" };
  }
}

function calculateDuration(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "数秒";
  if (diffMins < 60) return `${diffMins}分`;

  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}時間`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
