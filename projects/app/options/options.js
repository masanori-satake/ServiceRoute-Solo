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
  const data = await chrome.storage.local.get([
    "services",
    "businessHours",
  ]);

  services = data.services || [];
  const hours = data.businessHours || {
    start: "09:00",
    end: "18:00",
    weekendsOff: true,
  };

  document.getElementById("start-time").value = hours.start;
  document.getElementById("end-time").value = hours.end;
  document.getElementById("weekends-off").checked = hours.weekendsOff;

  renderServiceList();
}

function setupEventListeners() {
  // Save Monitoring Hours
  document.getElementById("save-hours").addEventListener("click", async () => {
    const start = document.getElementById("start-time").value;
    const end = document.getElementById("end-time").value;
    const weekendsOff = document.getElementById("weekends-off").checked;

    await chrome.storage.local.set({
      businessHours: { start, end, weekendsOff }
    });

    notifySettingsUpdated();
    showToast("監視時間を保存しました");
  });

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
  document.getElementById("save-service").addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const url = document.getElementById("url").value.trim();
    const loginKeyword = document.getElementById("loginKeyword").value.trim();

    if (!name || !url) {
      alert("サービス名とURLを入力してください");
      return;
    }

    try {
      const formattedUrl = new URL(url).origin + "/*";
      chrome.permissions.request({ origins: [formattedUrl] }, async (granted) => {
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
      });
    } catch (e) {
      alert("有効なURLを入力してください。");
    }
  });

  // Confirm Delete
  document.getElementById("confirm-delete").addEventListener("click", async () => {
    if (serviceToDeleteIndex > -1) {
      services.splice(serviceToDeleteIndex, 1);
      await saveServices();
      notifySettingsUpdated();
      deleteModal.style.display = "none";
      serviceToDeleteIndex = -1;
      renderServiceList();
    }
  });
}

function renderServiceList() {
  const list = document.getElementById("service-list");
  list.innerHTML = "";

  if (services.length === 0) {
    list.innerHTML = '<li class="service-item" style="justify-content: center; color: var(--md-sys-color-on-surface-variant);">登録されているサービスはありません</li>';
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
  const targetIndex = this.dataset.index;

  if (dragSrcIndex !== targetIndex) {
    const movedItem = services.splice(dragSrcIndex, 1)[0];
    services.splice(targetIndex, 0, movedItem);
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

function showToast(message) {
  // In a real M3 app we would use a SnackBar, but alert is used for simplicity here
  // as per the previous version's pattern.
  alert(message);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
