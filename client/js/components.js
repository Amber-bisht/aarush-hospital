/**
 * Reusable UI component builders – replacing React components.
 */

/* ── Status Badge ── */
function renderBadge(value) {
  const badgeClass = {
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    paid: 'badge-paid',
    unpaid: 'badge-unpaid',
    admin: 'badge-admin',
    doctor: 'badge-doctor',
    patient: 'badge-patient',
  };
  const cls = badgeClass[value] || 'badge-cancelled';
  const text = String(value || 'unknown').replace('_', ' ');
  return `<span class="badge ${cls}">${text}</span>`;
}

/* ── Stat Card ── */
function renderStatCard(label, value, helper) {
  return `
    <div class="glass-panel stat-card">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${value}</p>
      ${helper ? `<p class="stat-helper">${helper}</p>` : ''}
    </div>
  `;
}

/* ── Data Table ── */
function renderDataTable(columns, data, emptyMessage, actionsRenderer) {
  const hasActions = typeof actionsRenderer === 'function';

  let headHTML = columns.map(c => `<th>${c.header}</th>`).join('');
  if (hasActions) headHTML += `<th>Actions</th>`;

  let bodyHTML = '';
  if (data.length === 0) {
    const colspan = columns.length + (hasActions ? 1 : 0);
    bodyHTML = `<tr><td class="empty-cell" colspan="${colspan}">${emptyMessage || 'No records found.'}</td></tr>`;
  } else {
    bodyHTML = data.map(row => {
      let cells = columns.map(c => {
        const val = c.render ? c.render(row) : (row[c.key] ?? 'N/A');
        return `<td>${val}</td>`;
      }).join('');
      if (hasActions) cells += `<td>${actionsRenderer(row)}</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');
  }

  return `
    <div class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr>${headHTML}</tr></thead>
          <tbody>${bodyHTML}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Modal ── */
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('hidden');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('hidden');
}

/* ── Alert ── */
function showAlert(containerId, message, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cls = type === 'success' ? 'alert-success' : 'alert-error';
  container.innerHTML = `<div class="alert ${cls}">${message}</div>`;
  setTimeout(() => { container.innerHTML = ''; }, 8000);
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

/* ── Info Box ── */
function renderInfoBox(label, value, big) {
  return `
    <div class="info-box">
      <p class="info-label">${label}</p>
      <p class="info-value${big ? ' big' : ''}">${value ?? '--'}</p>
    </div>
  `;
}

/* ── Page Header ── */
function renderPageHeader(title, subtitle, actionsHTML) {
  return `
    <div class="page-header">
      <div>
        <h1 class="page-title">${title}</h1>
        ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
      </div>
      ${actionsHTML ? `<div class="page-actions">${actionsHTML}</div>` : ''}
    </div>
  `;
}

/* ── Form Field (HTML generator) ── */
function renderFormField(opts) {
  const { label, name, type, value, placeholder, required, as, options, className } = {
    type: 'text', value: '', placeholder: '', required: false, as: 'input', options: [], className: '',
    ...opts,
  };

  let fieldHTML = '';
  if (as === 'textarea') {
    fieldHTML = `<textarea class="field-input min-h-28 ${className}" name="${name}" placeholder="${placeholder}" ${required ? 'required' : ''}>${value}</textarea>`;
  } else if (as === 'select') {
    const optsHTML = options.map(o => `<option value="${o.value}" ${o.value == value ? 'selected' : ''}>${o.label}</option>`).join('');
    fieldHTML = `<select class="field-input ${className}" name="${name}" ${required ? 'required' : ''}>${optsHTML}</select>`;
  } else {
    fieldHTML = `<input class="field-input ${className}" type="${type}" name="${name}" value="${escapeHtml(String(value))}" placeholder="${placeholder}" ${required ? 'required' : ''}>`;
  }

  return `<label class="block"><span class="field-label">${label}</span>${fieldHTML}</label>`;
}

/* ── HTML escape ── */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, m => map[m]);
}

window.renderBadge = renderBadge;
window.renderStatCard = renderStatCard;
window.renderDataTable = renderDataTable;
window.openModal = openModal;
window.closeModal = closeModal;
window.showAlert = showAlert;
window.clearAlert = clearAlert;
window.renderInfoBox = renderInfoBox;
window.renderPageHeader = renderPageHeader;
window.renderFormField = renderFormField;
window.escapeHtml = escapeHtml;
