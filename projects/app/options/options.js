/**
 * ServiceRoute-Solo: options.js
 * Handles service management (add, delete, reorder) and monitoring time settings.
 */

let services = [];
let serviceToDeleteIndex = -1;
let serviceToEditIndex = -1;

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
  // Keep local settings in sync with background updates or other tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.services) {
        services = changes.services.newValue || [];
        renderServiceList();
      }
      if (changes.businessHours) {
        const hours = changes.businessHours.newValue;
        if (hours) {
          document.getElementById("start-time").value = hours.start;
          document.getElementById("end-time").value = hours.end;
          document.getElementById("weekends-off").checked = hours.weekendsOff;
        }
      }
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
  const importConfirmModal = document.getElementById("import-confirm-modal");

  document.getElementById("add-service-btn").addEventListener("click", () => {
    openAddModal();
  });

  document.getElementById("cancel-add").addEventListener("click", () => {
    addModal.style.display = "none";
    clearAddForm();
  });

  document.getElementById("use-redirect-url").addEventListener("click", () => {
    document.getElementById("url").value =
      document.getElementById("redirect-url").value;
    document.getElementById("redirect-suggestion").style.display = "none";
  });

  document.getElementById("cancel-delete").addEventListener("click", () => {
    deleteModal.style.display = "none";
    serviceToDeleteIndex = -1;
  });

  document.getElementById("cancel-import").addEventListener("click", () => {
    importConfirmModal.style.display = "none";
    fileInput.value = "";
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
    if (e.target === importConfirmModal) {
      importConfirmModal.style.display = "none";
      fileInput.value = "";
    }
  });

  // Add/Edit Service
  document
    .getElementById("save-service")
    .addEventListener("click", async () => {
      const name = document.getElementById("name").value.trim();
      const url = document.getElementById("url").value.trim();
      const loginKeyword = document.getElementById("loginKeyword").value.trim();
      const modalMessage = document.getElementById("modal-message");

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
              const serviceData = {
                name,
                url,
                loginKeyword,
                status: "💤",
                message: "監視待機中",
                lastCheck: null,
                failureSince: null,
              };

              if (serviceToEditIndex > -1) {
                // Keep status if URL hasn't changed, or reset if it has
                const oldService = services[serviceToEditIndex];
                if (oldService.url === url) {
                  serviceData.status = oldService.status;
                  serviceData.message = oldService.message;
                  serviceData.lastCheck = oldService.lastCheck;
                  serviceData.failureSince = oldService.failureSince;
                  if (oldService.redirectTarget) {
                    serviceData.redirectTarget = oldService.redirectTarget;
                  }
                }
                services[serviceToEditIndex] = serviceData;
              } else {
                services.push(serviceData);
              }

              await saveServices();
              notifySettingsUpdated();
              addModal.style.display = "none";
              clearAddForm();
              renderServiceList();
            } else {
              modalMessage.textContent =
                "権限が拒否されたため、サービスを登録できません。監視を行うには「承認」が必要です。";
              modalMessage.style.display = "block";
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
        if (
          !importedData ||
          typeof importedData !== "object" ||
          Array.isArray(importedData)
        ) {
          throw new Error("Invalid data format");
        }
        if (importedData.services) {
          if (!Array.isArray(importedData.services)) {
            throw new Error("Services must be an array");
          }
          for (const s of importedData.services) {
            if (
              !s ||
              typeof s !== "object" ||
              typeof s.name !== "string" ||
              typeof s.url !== "string"
            ) {
              throw new Error("Invalid service format");
            }
          }
        }
        if (importedData.businessHours) {
          const bh = importedData.businessHours;
          if (
            typeof bh !== "object" ||
            typeof bh.start !== "string" ||
            typeof bh.end !== "string"
          ) {
            throw new Error("Invalid business hours format");
          }
        }

        const mode = document.querySelector(
          'input[name="import-mode"]:checked',
        ).value;

        let servicesToImport = [];
        if (mode === "overwrite") {
          const rawServices = importedData.services || [];
          // Deduplicate within the imported file
          const seenUrls = new Set();
          servicesToImport = rawServices.filter((s) => {
            if (seenUrls.has(s.url)) return false;
            seenUrls.add(s.url);
            return true;
          });
        } else {
          const newServices = importedData.services || [];
          newServices.forEach((newS) => {
            if (
              !services.some((s) => s.url === newS.url) &&
              !servicesToImport.some((s) => s.url === newS.url)
            ) {
              servicesToImport.push(newS);
            }
          });
        }

        // Check for required permissions
        const allOrigins = [
          ...new Set(
            servicesToImport
              .map((s) => {
                try {
                  return new URL(s.url).origin + "/*";
                } catch (e) {
                  return null;
                }
              })
              .filter(Boolean),
          ),
        ];

        const grantedStatus = await Promise.all(
          allOrigins.map(
            (origin) =>
              new Promise((resolve) =>
                chrome.permissions.contains({ origins: [origin] }, resolve),
              ),
          ),
        );
        const uniqueOrigins = allOrigins.filter((_, i) => !grantedStatus[i]);

        // Check if there's actually anything to update
        if (
          mode === "append" &&
          servicesToImport.length === 0 &&
          !importedData.businessHours
        ) {
          showSnackbar("インポートする新しい設定はありません");
          fileInput.value = "";
          return;
        }

        // Show confirmation modal
        let message =
          mode === "overwrite"
            ? `現在の設定を上書きして、${servicesToImport.length}件のサービスをインポートします。`
            : `${servicesToImport.length}件の新しいサービスを追加インポートします。`;

        if (uniqueOrigins.length > 0) {
          message += " 監視のために必要な権限の承認を求めます。";
        }

        document.getElementById("import-confirm-message").textContent = message;
        importConfirmModal.style.display = "flex";

        // Setup one-time click listener for confirmation
        const confirmBtn = document.getElementById("confirm-import");
        const onConfirm = async (e) => {
          e.currentTarget.removeEventListener("click", onConfirm);

          if (uniqueOrigins.length > 0) {
            const granted = await new Promise((resolve) => {
              chrome.permissions.request({ origins: uniqueOrigins }, resolve);
            });

            if (!granted) {
              importConfirmModal.style.display = "none";
              fileInput.value = "";
              alert("権限が承認されなかったため、インポートを中止しました。");
              return;
            }
          }

          // Execute Import
          if (mode === "overwrite") {
            services = servicesToImport;
            const businessHours = importedData.businessHours || {
              start: "00:00",
              end: "00:00",
              weekendsOff: false,
            };
            await chrome.storage.local.set({ services, businessHours });
            document.getElementById("start-time").value = businessHours.start;
            document.getElementById("end-time").value = businessHours.end;
            document.getElementById("weekends-off").checked =
              businessHours.weekendsOff;
          } else {
            servicesToImport.forEach((s) => services.push(s));
            if (importedData.businessHours) {
              await chrome.storage.local.set({
                services,
                businessHours: importedData.businessHours,
              });
              document.getElementById("start-time").value =
                importedData.businessHours.start;
              document.getElementById("end-time").value =
                importedData.businessHours.end;
              document.getElementById("weekends-off").checked =
                importedData.businessHours.weekendsOff;
            } else {
              await chrome.storage.local.set({ services });
            }
          }

          importConfirmModal.style.display = "none";
          renderServiceList();
          notifySettingsUpdated();
          showSnackbar("設定をインポートしました");
          fileInput.value = "";
        };

        // Remove any previous listener just in case
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener("click", onConfirm);
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

    const statusIcon = getStatusIcon(service.status);
    li.innerHTML = `
      <div class="drag-handle">
        <span class="material-symbols-outlined">drag_indicator</span>
      </div>
      <div class="status-icon-small" style="margin-right: 12px; display: flex; align-items: center;">
        <span class="material-symbols-outlined" style="font-size: 20px; color: ${statusIcon.color}">${statusIcon.icon}</span>
      </div>
      <div class="service-info" style="cursor: pointer;">
        <span class="service-name">${escapeHtml(service.name)}</span>
        <span class="service-url">${escapeHtml(service.url)}</span>
      </div>
      <button class="btn-icon delete-btn" data-index="${index}" title="削除">
        <span class="material-symbols-outlined">delete</span>
      </button>
    `;

    // Edit event
    li.querySelector(".service-info").addEventListener("click", () => {
      openEditModal(index);
    });

    // Delete button event
    li.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
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

function openAddModal() {
  serviceToEditIndex = -1;
  document.getElementById("modal-title").textContent = "サービスの追加";
  document.getElementById("save-service").textContent = "追加して権限を承認";
  document.getElementById("modal-message").style.display = "none";
  document.getElementById("redirect-suggestion").style.display = "none";
  clearAddForm();
  document.getElementById("add-modal").style.display = "flex";
}

function openEditModal(index) {
  serviceToEditIndex = index;
  const service = services[index];
  document.getElementById("modal-title").textContent = "サービスの編集";
  document.getElementById("save-service").textContent = "適用して権限を承認";
  document.getElementById("modal-message").style.display = "none";

  document.getElementById("name").value = service.name;
  document.getElementById("url").value = service.url;
  document.getElementById("loginKeyword").value = service.loginKeyword || "";

  const redirectSuggestion = document.getElementById("redirect-suggestion");
  if (service.redirectTarget) {
    redirectSuggestion.style.display = "block";
    document.getElementById("redirect-url").value = service.redirectTarget;
  } else {
    redirectSuggestion.style.display = "none";
  }

  document.getElementById("add-modal").style.display = "flex";
}

function clearAddForm() {
  document.getElementById("name").value = "";
  document.getElementById("url").value = "";
  document.getElementById("loginKeyword").value = "";
  document.getElementById("redirect-url").value = "";
}

function showSnackbar(message) {
  const snackbar = document.getElementById("snackbar");
  snackbar.textContent = message;
  snackbar.className = "show";
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000);
}

function getStatusIcon(status) {
  switch (status) {
    case "🟢":
      return { icon: "check_circle", color: "#2e7d32" };
    case "🟡":
      return { icon: "login", color: "#f57c00" };
    case "⚠️":
      return { icon: "warning", color: "#f57c00" };
    case "❌":
      return { icon: "error", color: "#d32f2f" };
    case "🚫":
      return { icon: "no_accounts", color: "#757575" };
    case "🐢":
      return { icon: "speed", color: "#ed6c02" };
    case "🔄":
      return { icon: "sync_alt", color: "var(--md-sys-color-primary)" };
    case "💤":
      return { icon: "bedtime", color: "#1976d2" };
    default:
      return { icon: "help", color: "var(--md-sys-color-outline)" };
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
