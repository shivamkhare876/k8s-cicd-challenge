document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const podNameEl = document.getElementById('pod-name');
  const livenessEl = document.getElementById('liveness-status');
  const readinessEl = document.getElementById('readiness-status');
  const uptimeEl = document.getElementById('uptime-value');
  const envTagEl = document.getElementById('env-tag');

  const kvForm = document.getElementById('kv-form');
  const keyInput = document.getElementById('key-input');
  const valueInput = document.getElementById('value-input');
  const jsonOutput = document.getElementById('json-output');
  const queryTimestamp = document.getElementById('query-timestamp');

  const btnFetch = document.getElementById('btn-fetch');
  const btnSimulateFail = document.getElementById('btn-simulate-fail');
  const btnRestore = document.getElementById('btn-restore');
  const consoleLogs = document.getElementById('console-logs');
  const btnClearLogs = document.getElementById('btn-clear-logs');

  function appendLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${time}] ${msg}`;
    consoleLogs.appendChild(entry);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  btnClearLogs.addEventListener('click', () => {
    consoleLogs.innerHTML = '';
  });

  // Poll Telemetry every 3 seconds
  async function updateTelemetry() {
    try {
      const res = await fetch('/api/v1/status');
      if (res.ok) {
        const data = await res.json();
        podNameEl.textContent = data.pod || 'K8s Pod';
        uptimeEl.textContent = `${Math.floor(data.uptime)}s`;
        envTagEl.textContent = (data.environment || 'production').toUpperCase();

        if (data.dbConnected) {
          readinessEl.textContent = 'READY (DB OK)';
          readinessEl.className = 'badge badge-success';
        } else {
          readinessEl.textContent = 'UNREADY (DB DISCONNECTED)';
          readinessEl.className = 'badge badge-danger';
        }
      }
    } catch (e) {
      readinessEl.textContent = 'UNREADY (HTTP ERROR)';
      readinessEl.className = 'badge badge-danger';
    }

    try {
      const res = await fetch('/healthz');
      if (res.ok) {
        livenessEl.textContent = 'ALIVE (HTTP 200)';
        livenessEl.className = 'badge badge-success';
      } else {
        livenessEl.textContent = 'DEAD (HTTP 500)';
        livenessEl.className = 'badge badge-danger';
      }
    } catch (e) {
      livenessEl.textContent = 'OFFLINE';
      livenessEl.className = 'badge badge-danger';
    }
  }

  setInterval(updateTelemetry, 3000);
  updateTelemetry();

  // Handle Redis Form Save
  kvForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = keyInput.value.trim();
    let value;
    try {
      value = JSON.parse(valueInput.value.trim());
    } catch (err) {
      value = valueInput.value.trim();
    }

    appendLog(`[POST /api/v1/data] Saving key "${key}"...`, 'info');
    try {
      const res = await fetch('/api/v1/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      queryTimestamp.textContent = new Date().toLocaleTimeString();
      jsonOutput.textContent = JSON.stringify(data, null, 2);

      if (res.ok) {
        appendLog(`[SUCCESS] Record "${key}" saved to Redis store.`, 'success');
      } else {
        appendLog(`[ERROR ${res.status}] ${data.error || 'Failed to save record'}`, 'error');
      }
    } catch (err) {
      appendLog(`[NETWORK ERROR] ${err.message}`, 'error');
    }
  });

  // Handle Redis Fetch
  btnFetch.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    if (!key) {
      alert('Please enter a key to fetch');
      return;
    }

    appendLog(`[GET /api/v1/data/${key}] Fetching key...`, 'info');
    try {
      const res = await fetch(`/api/v1/data/${key}`);
      const data = await res.json();
      queryTimestamp.textContent = new Date().toLocaleTimeString();
      jsonOutput.textContent = JSON.stringify(data, null, 2);

      if (res.ok) {
        appendLog(`[SUCCESS] Fetched key "${key}".`, 'success');
      } else {
        appendLog(`[ERROR ${res.status}] Key "${key}" not found or DB offline.`, 'error');
      }
    } catch (err) {
      appendLog(`[NETWORK ERROR] ${err.message}`, 'error');
    }
  });

  // Chaos Buttons
  btnSimulateFail.addEventListener('click', async () => {
    appendLog('[CHAOS SIMULATION] Triggering DB host isolation...', 'error');
    try {
      const res = await fetch('/api/v1/chaos/fail', { method: 'POST' });
      appendLog('[CHAOS] DB connection disabled. Readiness probe /readyz will return 500.', 'error');
      updateTelemetry();
    } catch(e) {
      appendLog('[CHAOS] Simulated failure active.', 'error');
    }
  });

  btnRestore.addEventListener('click', async () => {
    appendLog('[CHAOS REMEDIATION] Restoring DB host connection...', 'success');
    try {
      const res = await fetch('/api/v1/chaos/restore', { method: 'POST' });
      appendLog('[RESTORE] DB connection re-established. Readiness probe /readyz HTTP 200 OK.', 'success');
      updateTelemetry();
    } catch(e) {
      appendLog('[RESTORE] Health restored.', 'success');
    }
  });
});
