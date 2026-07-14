// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

// Close menu when a link is clicked (mobile)
links.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => links.classList.remove('open'));
});

// Demo form handler
function handleSubmit(event) {
  event.preventDefault();
  const note = document.getElementById('formNote');
  note.hidden = false;
  event.target.querySelectorAll('input, textarea').forEach((el) => (el.value = ''));
  return false;
}

// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();
