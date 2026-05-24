/**
 * ServiceRoute-Solo: options.js
 * Handles service management and dynamic permission requests.
 */

document.addEventListener("DOMContentLoaded", async () => {
  await loadServices();
  await loadBusinessHours();

  document.getElementById("save-service").addEventListener("click", addService);
  document
    .getElementById("save-hours")
    .addEventListener("click", saveBusinessHours);
  document
    .getElementById("export-btn")
    .addEventListener("click", exportSettings);
  document
    .getElementById("import-btn")
    .addEventListener("click", importSettings);
});

async function loadServices() {
  const { services = [] } = await chrome.storage.local.get("services");
  const list = document.getElementById("service-list");
  list.innerHTML = "";

  services.forEach((service, index) => {
    const li = document.createElement("li");
    li.className = "service-item";
    li.innerHTML = `
      <div class="service-info">
        <span class="service-name">${escapeHtml(service.name)}</span>
        <span class="service-url">${escapeHtml(service.url)}</span>
      </div>
      <button class="delete-btn" data-index="${index}">削除</button>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", deleteService);
  });
}

async function addService() {
  const nameInput = document.getElementById("name");
  const urlInput = document.getElementById("url");
  const keywordInput = document.getElementById("loginKeyword");

  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  const loginKeyword = keywordInput.value.trim();

  if (!name || !url) {
    alert("名前とURLを入力してください。");
    return;
  }

  try {
    const origin = new URL(url).origin + "/*";

    // Request dynamic permission
    chrome.permissions.request(
      {
        origins: [origin],
      },
      async (granted) => {
        if (granted) {
          const { services = [] } = await chrome.storage.local.get("services");
          services.push({
            id: Date.now().toString(),
            name,
            url,
            loginKeyword,
            status: "🟢",
            message: "未チェック",
            failureSince: null,
            lastCheck: null,
          });

          await chrome.storage.local.set({ services });
          nameInput.value = "";
          urlInput.value = "";
          keywordInput.value = "";
          await loadServices();

          // Notify background to re-setup alarms if necessary
          chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
        } else {
          alert(
            "権限が承認されませんでした。監視を開始するには権限が必要です。",
          );
        }
      },
    );
  } catch (e) {
    alert("無効なURL形式です。");
  }
}

async function deleteService(e) {
  const index = e.target.getAttribute("data-index");
  const { services = [] } = await chrome.storage.local.get("services");
  services.splice(index, 1);
  await chrome.storage.local.set({ services });
  await loadServices();
  chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
}

async function loadBusinessHours() {
  const { businessHours } = await chrome.storage.local.get("businessHours");
  if (businessHours) {
    document.getElementById("start-time").value = businessHours.start;
    document.getElementById("end-time").value = businessHours.end;
    document.getElementById("weekends-off").checked = businessHours.weekendsOff;
  }
}

async function saveBusinessHours() {
  const businessHours = {
    start: document.getElementById("start-time").value,
    end: document.getElementById("end-time").value,
    weekendsOff: document.getElementById("weekends-off").checked,
  };

  await chrome.storage.local.set({ businessHours });
  alert("監視時間を保存しました。");
  chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
}

async function exportSettings() {
  const data = await chrome.storage.local.get(["services", "businessHours"]);
  const json = JSON.stringify(data, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    alert("設定をクリップボードにコピーしました。");
  } catch (err) {
    console.error("Export failed", err);
    alert("エクスポートに失敗しました。");
  }
}

async function importSettings() {
  try {
    const text = await navigator.clipboard.readText();
    const data = JSON.parse(text);

    if (!data.services || !Array.isArray(data.services)) {
      throw new Error("Invalid format: 'services' array is missing.");
    }

    if (
      !confirm(
        "現在の設定が上書きされます。インポートを続行しますか？\n※個別のサービスへのアクセス権限は別途承認が必要になる場合があります。",
      )
    ) {
      return;
    }

    await chrome.storage.local.set({
      services: data.services,
      businessHours: data.businessHours || null,
    });

    await loadServices();
    await loadBusinessHours();
    chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
    alert("インポートが完了しました。");
  } catch (err) {
    console.error("Import failed", err);
    alert(
      "インポートに失敗しました。クリップボードに正しい形式のJSONがあるか確認してください。",
    );
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
