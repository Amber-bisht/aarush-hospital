/**
 * Utility functions – formatting and role helpers.
 */

/* ── Formatting ── */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTodayDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

/* ── Role helpers ── */
function getDefaultRouteForRole(role) {
  if (role === 'admin') return '/dashboard.html';
  return '/appointments.html';
}

function getNavigationByRole(role) {
  const common = [
    { label: 'Appointments', path: '/appointments.html' },
    { label: 'Doctors', path: '/doctors.html' },
  ];

  if (role === 'admin') {
    return [
      { label: 'Dashboard', path: '/dashboard.html' },
      { label: 'Patients', path: '/patients.html' },
      { label: 'Doctors', path: '/doctors.html' },
      { label: 'Appointments', path: '/appointments.html' },
      { label: 'Billing', path: '/billing.html' },
    ];
  }

  if (role === 'doctor') {
    return [...common, { label: 'Patients', path: '/patients.html' }];
  }

  // Patient role
  return [
    { label: 'Appointments', path: '/appointments.html' },
    { label: 'Billing', path: '/billing.html' },
  ];
}

/* ── DOM helpers ── */
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function el(tag, attrs, ...children) {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  return element;
}

window.formatCurrency = formatCurrency;
window.formatDateTime = formatDateTime;
window.formatDate = formatDate;
window.formatTodayDate = formatTodayDate;
window.getDefaultRouteForRole = getDefaultRouteForRole;
window.getNavigationByRole = getNavigationByRole;
window.$ = $;
window.$$ = $$;
window.el = el;
