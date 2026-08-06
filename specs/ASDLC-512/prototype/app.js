'use strict';

// Active screen state
let activeScreenId = 'screen-allday';

/**
 * Switch between the All Day and Timed event screens.
 * Shows/hides the annotation callout based on which screen is active.
 */
function switchScreen(id) {
  if (id === activeScreenId) return;

  // Deactivate current screen
  const current = document.getElementById(activeScreenId);
  if (current) current.classList.remove('active');

  // Activate new screen
  const next = document.getElementById(id);
  if (next) next.classList.add('active');

  activeScreenId = id;

  // Update toggle button states
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  const btnId = id === 'screen-allday' ? 'btn-allday' : 'btn-timed';
  const activeBtn = document.getElementById(btnId);
  if (activeBtn) activeBtn.classList.add('active');

  // Show annotation only on the all-day screen
  const annotation = document.getElementById('annotation-allday');
  if (annotation) {
    if (id === 'screen-allday') {
      annotation.classList.add('visible');
    } else {
      annotation.classList.remove('visible');
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Start with annotation visible for the all-day screen
  const annotation = document.getElementById('annotation-allday');
  if (annotation) {
    // Brief delay so the fade-in is noticeable
    setTimeout(() => annotation.classList.add('visible'), 400);
  }

  // Button tap ripple effect for action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.style.transform = 'scale(0.97)';
      setTimeout(() => { this.style.transform = ''; }, 120);
    });
  });

  // Nav action button — calendar toggle feedback
  document.querySelectorAll('.nav-action').forEach(btn => {
    btn.addEventListener('click', function () {
      const svg = this.querySelector('svg');
      if (!svg) return;

      // Toggle between "add" and "checkmark" icon paths
      const isAdded = btn.dataset.added === 'true';
      if (isAdded) {
        // Back to "add" icon
        svg.innerHTML = `
          <rect x="2" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 2v4M15 2v4M2 9h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M11 13v4M9 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        `;
        btn.dataset.added = 'false';
      } else {
        // Checkmark icon (event added)
        svg.innerHTML = `
          <rect x="2" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 2v4M15 2v4M2 9h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M7 15l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
        btn.dataset.added = 'true';
      }
    });
  });
});
