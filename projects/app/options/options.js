/**
 * ServiceRoute-Solo: options.js
 * Handles service management (add, delete, reorder) and monitoring time settings.
 */

let services = [];
let serviceToDeleteIndex = -1;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const data = await chrome.storage.local.get(["services", "businessHours"]);

  services = data.services || [];
  const hours = data.businessHours || {
    start: "00:00",
    end: "00:00",
    weekendsOff: false,
  };

  document.getElementById("start-time").value = hours.start;
  document.getElementById("end-time").value = hours.end;
  document.getElementById("weekends-off").checked = hours.weekendsOff;

  renderServiceList();
}

function setupEventListeners() {
  // Keep local services in sync with background updates to prevent overwriting status/lastCheck
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.services) {
      const newServices = changes.services.newValue || [];
      newServices.forEach((newS) => {
        const localS = services.find((s) => s.url === newS.url);
        if (localS) {
          localS.status = newS.status;
          localS.message = newS.message;
          localS.lastCheck = newS.lastCheck;
          localS.failureSince = newS.failureSince;
        }
      });
    }
  });

  // Auto-save Monitoring Hours
  const saveHours = async () => {
    const start = document.getElementById("start-time").value;
    const end = document.getElementById("end-time").value;
    const weekendsOff = document.getElementById("weekends-off").checked;

    await chrome.storage.local.set({
      businessHours: { start, end, weekendsOff },
    });

    notifySettingsUpdated();
    showSnackbar("監視時間を保存しました");
  };

  document.getElementById("start-time").addEventListener("change", saveHours);
  document.getElementById("end-time").addEventListener("change", saveHours);
  document.getElementById("weekends-off").addEventListener("change", saveHours);

  // Modal controls
  const addModal = document.getElementById("add-modal");
  const deleteModal = document.getElementById("delete-modal");

  document.getElementById("add-service-btn").addEventListener("click", () => {
    addModal.style.display = "flex";
  });

  document.getElementById("cancel-add").addEventListener("click", () => {
    addModal.style.display = "none";
    clearAddForm();
  });

  document.getElementById("cancel-delete").addEventListener("click", () => {
    deleteModal.style.display = "none";
    serviceToDeleteIndex = -1;
  });

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    if (e.target === addModal) {
      addModal.style.display = "none";
      clearAddForm();
    }
    if (e.target === deleteModal) {
      deleteModal.style.display = "none";
      serviceToDeleteIndex = -1;
    }
  });

  // Add Service
  document
    .getElementById("save-service")
    .addEventListener("click", async () => {
      const name = document.getElementById("name").value.trim();
      const url = document.getElementById("url").value.trim();
      const loginKeyword = document.getElementById("loginKeyword").value.trim();

      if (!name || !url) {
        alert("サービス名とURLを入力してください");
        return;
      }

      try {
        const formattedUrl = new URL(url).origin + "/*";
        chrome.permissions.request(
          { origins: [formattedUrl] },
          async (granted) => {
            if (granted) {
              services.push({
                name,
                url,
                loginKeyword,
                status: "💤",
                message: "監視待機中",
                lastCheck: null,
              });
              await saveServices();
              notifySettingsUpdated();
              addModal.style.display = "none";
              clearAddForm();
              renderServiceList();
            } else {
              alert("権限が拒否されたため、サービスを追加できませんでした。");
            }
          },
        );
      } catch (e) {
        alert("有効なURLを入力してください。");
      }
    });

  // Confirm Delete
  document
    .getElementById("confirm-delete")
    .addEventListener("click", async () => {
      if (serviceToDeleteIndex > -1) {
        services.splice(serviceToDeleteIndex, 1);
        await saveServices();
        notifySettingsUpdated();
        deleteModal.style.display = "none";
        serviceToDeleteIndex = -1;
        renderServiceList();
      }
    });

  // Export
  document.getElementById("export-btn").addEventListener("click", async () => {
    const data = await chrome.storage.local.get(["services", "businessHours"]);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ServiceRoute-settings.json";
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar("設定をエクスポートしました");
  });

  // Import
  const fileInput = document.getElementById("import-file");
  document.getElementById("import-btn").addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // Validation
        if (!importedData || typeof importedData !== "object" || Array.isArray(importedData)) {
          throw new Error("Invalid data format");
        }
        if (importedData.services) {
          if (!Array.isArray(importedData.services)) {
            throw new Error("Services must be an array");
          }
          for (const s of importedData.services) {
            if (!s || typeof s !== "object" || typeof s.name !== "string" || typeof s.url !== "string") {
              throw new Error("Invalid service format");
            }
          }
        }
        if (importedData.businessHours) {
          const bh = importedData.businessHours;
          if (typeof bh !== "object" || typeof bh.start !== "string" || typeof bh.end !== "string") {
            throw new Error("Invalid business hours format");
          }
        }

        const mode = document.querySelector('input[name="import-mode"]:checked').value;

        if (mode === "overwrite") {
          // Overwrite everything
          services = importedData.services || [];
          const businessHours = importedData.businessHours || {
            start: "00:00",
            end: "00:00",
            weekendsOff: false,
          };
          await chrome.storage.local.set({ services, businessHours });

          // Update UI
          document.getElementById("start-time").value = businessHours.start;
          document.getElementById("end-time").value = businessHours.end;
          document.getElementById("weekends-off").checked = businessHours.weekendsOff;
        } else {
          // Append services, update businessHours
          const newServices = importedData.services || [];
          // Simple deduplication based on URL
          newServices.forEach(newS => {
            if (!services.some(s => s.url === newS.url)) {
              services.push(newS);
            }
          });

          if (importedData.businessHours) {
            await chrome.storage.local.set({
              services,
              businessHours: importedData.businessHours
            });
            document.getElementById("start-time").value = importedData.businessHours.start;
            document.getElementById("end-time").value = importedData.businessHours.end;
            document.getElementById("weekends-off").checked = importedData.businessHours.weekendsOff;
          } else {
            await chrome.storage.local.set({ services });
          }
        }

        renderServiceList();
        notifySettingsUpdated();
        showSnackbar("設定をインポートしました");
        fileInput.value = ""; // Reset
      } catch (err) {
        alert("インポートに失敗しました。ファイル形式を確認してください。");
        console.error(err);
      }
    };
    reader.readAsText(file);
  });
}

function renderServiceList() {
  const list = document.getElementById("service-list");
  list.innerHTML = "";

  if (services.length === 0) {
    list.innerHTML =
      '<li class="service-item" style="justify-content: center; color: var(--md-sys-color-on-surface-variant);">登録されているサービスはありません</li>';
    return;
  }

  services.forEach((service, index) => {
    const li = document.createElement("li");
    li.className = "service-item";
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
      <div class="drag-handle">
        <span class="material-symbols-outlined">drag_indicator</span>
      </div>
      <div class="service-info">
        <span class="service-name">${escapeHtml(service.name)}</span>
        <span class="service-url">${escapeHtml(service.url)}</span>
      </div>
      <button class="btn-icon delete-btn" data-index="${index}" title="削除">
        <span class="material-symbols-outlined">delete</span>
      </button>
    `;

    // Delete button event
    li.querySelector(".delete-btn").addEventListener("click", (e) => {
      serviceToDeleteIndex = index;
      document.getElementById("delete-service-name").textContent = service.name;
      document.getElementById("delete-modal").style.display = "flex";
    });

    // Drag and Drop events
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    list.appendChild(li);
  });
}

let dragSrcIndex = null;

function handleDragStart(e) {
  dragSrcIndex = this.dataset.index;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  if (dragSrcIndex === null) {
    return false;
  }
  const targetIndex = this.dataset.index;

  if (dragSrcIndex !== targetIndex) {
    const srcIdx = parseInt(dragSrcIndex, 10);
    const targetIdx = parseInt(targetIndex, 10);
    const movedItem = services.splice(srcIdx, 1)[0];
    services.splice(targetIdx, 0, movedItem);
    saveServices().then(() => {
      notifySettingsUpdated();
      renderServiceList();
    });
  }
  return false;
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

async function saveServices() {
  await chrome.storage.local.set({ services });
}

function notifySettingsUpdated() {
  chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
}

function clearAddForm() {
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("loginKeyword").value = "";
}

function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");
  snackbar.textContent = message;
  snackbar.className = "show";
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
