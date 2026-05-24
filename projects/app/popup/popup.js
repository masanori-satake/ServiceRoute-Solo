/**
 * ServiceRoute-Solo: popup.js
 * Visualizes service status and handles manual re-check.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await renderServices();

  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('recheck-btn').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'チェック中...';

    chrome.runtime.sendMessage({ type: 'RECHECK_NOW' }, async (response) => {
      await renderServices();
      btn.disabled = false;
      btn.textContent = '今すぐ再チェック';
    });
  });
});

async function renderServices() {
  const { services = [] } = await chrome.storage.local.get('services');
  const container = document.getElementById('service-container');

  if (services.length === 0) {
    container.innerHTML = '<div class="empty-state">サービスが登録されていません。<br>設定から追加してください。</div>';
    return;
  }

  container.innerHTML = '';
  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card';

    const duration = service.failureSince ? calculateDuration(service.failureSince) : '';
    const lastCheckTime = service.lastCheck ? new Date(service.lastCheck).toLocaleTimeString() : '未実施';

    card.innerHTML = `
      <div class="status-icon">${service.status || '🟢'}</div>
      <div class="service-info">
        <span class="service-name">${escapeHtml(service.name)}</span>
        <span class="service-status-msg">${escapeHtml(service.message)}</span>
        ${duration ? `<span class="failure-duration">(${duration}前から)</span>` : ''}
        <span class="last-check">最終確認: ${lastCheckTime}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function calculateDuration(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return '数秒';
  if (diffMins < 60) return `${diffMins}分`;

  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}時間`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
