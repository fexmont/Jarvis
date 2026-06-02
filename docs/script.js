// Piccoli effetti — anche questi, ovviamente, scritti dall'AI.

// Animazione barre competenze quando entrano in vista
const bars = document.querySelectorAll('.bar i');
bars.forEach(b => { const w = b.style.width; b.style.width = '0'; b.dataset.w = w; });

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const bar = e.target.querySelector('.bar i');
      if (bar && bar.dataset.w) {
        bar.style.transition = 'width 1.1s cubic-bezier(.2,.8,.2,1)';
        requestAnimationFrame(() => bar.style.width = bar.dataset.w);
      }
      e.target.classList.add('seen');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.skill-card').forEach(c => io.observe(c));

// Easter egg: clicca 5 volte sulla foto di Tucci
let clicks = 0;
const photo = document.getElementById('tucci-photo');
if (photo) {
  photo.addEventListener('click', () => {
    clicks++;
    photo.style.transform = `rotate(${(Math.random()*6-3).toFixed(1)}deg)`;
    if (clicks === 5) {
      alert('Tucci: "Non toccare la foto. So io come si fa." (poi chiede all\'AID come si fa)');
      clicks = 0;
      photo.style.transform = '';
    }
  });
}
