/* ─────────────────────────────────────────────────────────────────────────
   Berkeley Mobile — ASDLC-512 Prototype Navigation Engine
   Mirrors NavigationStack (push/pop) from EventDetailView
   ───────────────────────────────────────────────────────────────────────── */

const navStack = [];
let toastTimer = null;

/* ── Navigation: Push (slide in from right, 320ms) ─────────────────────── */
function pushScreen(id) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById(id);
  if (!next || next === current) return;

  current.classList.remove('active');
  current.classList.add('prev-active');
  next.classList.remove('exiting', 'prev-active');
  next.classList.add('active');

  navStack.push(current.id);

  /* Animate: next slides in from right → center */
  next.style.transform = 'translateX(100%)';
  next.style.opacity = '0';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.style.transition = 'transform 320ms cubic-bezier(0.42, 0, 0.15, 1), opacity 320ms cubic-bezier(0.42, 0, 0.15, 1)';
      next.style.transform = 'translateX(0)';
      next.style.opacity = '1';
      current.style.transition = 'transform 320ms cubic-bezier(0.42, 0, 0.15, 1), opacity 320ms cubic-bezier(0.42, 0, 0.15, 1)';
      current.style.transform = 'translateX(-30%)';
      current.style.opacity = '0.6';
    });
  });

  setTimeout(() => {
    current.style.transform = '';
    current.style.opacity = '';
    current.style.transition = '';
    next.style.transform = '';
    next.style.opacity = '';
    next.style.transition = '';
    current.style.pointerEvents = 'none';
    next.style.pointerEvents = 'all';
  }, 340);
}

/* ── Navigation: Pop (slide back to right, 300ms) ──────────────────────── */
function popScreen() {
  if (navStack.length === 0) return;

  const current = document.querySelector('.screen.active');
  const prevId = navStack.pop();
  const prev = document.getElementById(prevId);
  if (!prev) return;

  /* Restore prev from left position */
  prev.style.transform = 'translateX(-30%)';
  prev.style.opacity = '0.6';
  prev.style.pointerEvents = 'all';
  prev.classList.remove('prev-active');
  prev.classList.add('active');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      prev.style.transition = 'transform 300ms cubic-bezier(0.42, 0, 0.15, 1), opacity 300ms cubic-bezier(0.42, 0, 0.15, 1)';
      prev.style.transform = 'translateX(0)';
      prev.style.opacity = '1';
      current.style.transition = 'transform 300ms cubic-bezier(0.42, 0, 0.15, 1), opacity 300ms cubic-bezier(0.42, 0, 0.15, 1)';
      current.style.transform = 'translateX(100%)';
      current.style.opacity = '0';
    });
  });

  setTimeout(() => {
    current.classList.remove('active');
    current.classList.add('exiting');
    current.style.transform = '';
    current.style.opacity = '';
    current.style.transition = '';
    current.style.pointerEvents = '';
    prev.style.transform = '';
    prev.style.opacity = '';
    prev.style.transition = '';
  }, 320);
}

/* ── Before / After Toggle ──────────────────────────────────────────────── */
/*
 * Demonstrates the ASDLC-512 fix:
 *   Before (Bug):   clock icon + plain "12:00 AM" text (misleading)
 *   After (Fixed):  clock icon + "All Day" capsule/pill badge (correct)
 */
function showTimeMode(mode) {
  const afterEl  = document.getElementById('time-mode-after');
  const beforeEl = document.getElementById('time-mode-before');
  const btnBefore = document.getElementById('btn-before');
  const btnAfter  = document.getElementById('btn-after');

  if (!afterEl || !beforeEl) return;

  if (mode === 'before') {
    /* Show bug: plain "12:00 AM" text */
    afterEl.style.display  = 'none';
    beforeEl.style.display = 'inline';

    btnBefore.classList.add('seg-active');
    btnAfter.classList.remove('seg-active');

    /* Briefly highlight the row to draw attention */
    flashRow('allday-time-row', '#FF3B30');
  } else {
    /* Show fix: "All Day" capsule badge */
    beforeEl.style.display = 'none';
    afterEl.style.display  = 'inline-flex';

    btnAfter.classList.add('seg-active');
    btnBefore.classList.remove('seg-active');

    flashRow('allday-time-row', '#003262');
  }
}

/* Brief background flash on a row to draw attention to the change */
function flashRow(rowId, color) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.style.transition = 'background 0.15s';
  row.style.background = `rgba(${hexToRgb(color)}, 0.12)`;
  setTimeout(() => {
    row.style.background = '';
  }, 600);
}

function hexToRgb(hex) {
  /* Accepts "#RRGGBB" or named fallback */
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '120, 120, 128';
}

/* ── Add to Calendar Toggle ─────────────────────────────────────────────── */
const calendarState = {};

function toggleCalendarBtn(screen) {
  calendarState[screen] = !calendarState[screen];
  const added = calendarState[screen];
  const iconEl = document.getElementById(`cal-icon-${screen}`);
  if (!iconEl) return;

  if (added) {
    /* calendar.badge.checkmark — event already in calendar */
    iconEl.innerHTML = `
      <rect x="2" y="4.5" width="15" height="14" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <line x1="2" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="6.5" y1="2.5" x2="6.5" y2="6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12.5" y1="2.5" x2="12.5" y2="6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="19.5" cy="19.5" r="4.2" fill="#34C759"/>
      <path d="M17.5 19.5L19 21L21.5 17.5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `;
    showToast('Added to Calendar');
  } else {
    /* calendar.badge.plus — add to calendar */
    iconEl.innerHTML = `
      <rect x="2" y="4.5" width="15" height="14" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <line x1="2" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.5"/>
      <line x1="6.5" y1="2.5" x2="6.5" y2="6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12.5" y1="2.5" x2="12.5" y2="6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="19.5" cy="19.5" r="4.2" fill="#007AFF"/>
      <line x1="19.5" y1="17" x2="19.5" y2="22" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="17" y1="19.5" x2="22" y2="19.5" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    `;
    showToast('Removed from Calendar');
  }
}

/* ── Toast Notification ─────────────────────────────────────────────────── */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toast.classList.remove('toast-visible');
  }

  toast.textContent = message;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });
  });

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-visible');
    toastTimer = null;
  }, 2800);
}

/* ── Initialisation ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Ensure the "After (Fixed)" mode is the default on load */
  showTimeMode('after');
});
