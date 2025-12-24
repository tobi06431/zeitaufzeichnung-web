/**
 * UI Components & Interactions
 * Handles: User Dropdown, Mobile Menu, Flash Messages, Loading States
 * Note: Panel collapse functionality is in lib/ui.js to avoid conflicts
 */

// ================= USER DROPDOWN =================
document.addEventListener('DOMContentLoaded', function() {
  const dropdown = document.querySelector('.user-dropdown');
  if (!dropdown) return;
  
  const trigger = dropdown.querySelector('.user-dropdown__trigger');
  const menu = dropdown.querySelector('.user-dropdown__menu');
  
  if (!trigger || !menu) return;
  
  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    const isOpen = menu.classList.contains('user-dropdown__menu--open');
    
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });
  
  function openDropdown() {
    menu.classList.add('user-dropdown__menu--open');
    trigger.classList.add('user-dropdown__trigger--active');
    trigger.setAttribute('aria-expanded', 'true');
  }
  
  function closeDropdown() {
    menu.classList.remove('user-dropdown__menu--open');
    trigger.classList.remove('user-dropdown__trigger--active');
    trigger.setAttribute('aria-expanded', 'false');
  }
  
  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target)) {
      closeDropdown();
    }
  });
  
  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });
});

// ================= MOBILE MENU =================
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.site-header__nav');
  
  if (!toggle || !nav) return;
  
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    const isOpen = nav.classList.contains('site-header__nav--open');
    
    if (isOpen) {
      nav.classList.remove('site-header__nav--open');
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      nav.classList.add('site-header__nav--open');
      toggle.setAttribute('aria-expanded', 'true');
    }
  });
  
  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('site-header__nav--open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// ================= FLASH MESSAGES AUTO-HIDE =================
document.addEventListener('DOMContentLoaded', function() {
  const flashes = document.querySelectorAll('.flash');
  
  flashes.forEach(function(flash) {
    // Auto-hide after 5 seconds
    setTimeout(function() {
      flash.style.animation = 'slideOut 0.3s ease';
      setTimeout(function() {
        flash.remove();
      }, 300);
    }, 5000);
    
    // Manual close on click
    flash.style.cursor = 'pointer';
    flash.addEventListener('click', function() {
      flash.style.animation = 'slideOut 0.3s ease';
      setTimeout(function() {
        flash.remove();
      }, 300);
    });
  });
});

// Slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ================= BUTTON LOADING STATE =================
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('btn--loading');
    button.disabled = true;
  } else {
    button.classList.remove('btn--loading');
    button.disabled = false;
  }
}

// Auto-apply loading state to form submit buttons
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn && !submitBtn.classList.contains('btn--loading')) {
        setButtonLoading(submitBtn, true);
      }
    });
  });
});

// ================= SMOOTH SCROLL =================
// Only apply to valid anchor links (not #)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
