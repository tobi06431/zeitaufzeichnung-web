/* Auto-dismiss Flash-Nachrichten */

document.addEventListener('DOMContentLoaded', () => {
  const flashMessages = document.querySelectorAll('.flash');
  
  flashMessages.forEach(flash => {
    // Auto-dismiss nach 3 Sekunden
    setTimeout(() => {
      flash.classList.add('fade-out');
      setTimeout(() => flash.remove(), 300);
    }, 3000);
  });
});
