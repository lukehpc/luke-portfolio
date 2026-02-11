document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(link.getAttribute('href'))
      .scrollIntoView({ behavior: 'smooth' });
  });
});
const toggleBtn = document.getElementById('theme-toggle');
const body = document.body;

window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  body.classList.add('light');
  toggleBtn.textContent = '☀️ Light Mode';
}

toggleBtn.addEventListener('click', () => {
  body.classList.toggle('light');

  if (body.classList.contains('light')) {
    localStorage.setItem('theme', 'light');
    toggleBtn.textContent = '☀️ Light Mode';
  } else {
    localStorage.setItem('theme', 'dark');
    toggleBtn.textContent = '🌙 Dark Mode';
  }
});

const reveals = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
  reveals.forEach(el => {
    const elementTop = el.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (elementTop < windowHeight - 80) {
      el.classList.add('active');
    }
  });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

const scrollBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  scrollBtn.classList.toggle('show', window.scrollY > 300);
});

scrollBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
