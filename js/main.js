// ============ header scroll state ============
const header = document.getElementById('siteHeader');
const onScroll = ()=> header.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive:true });

// ============ mobile menu ============
const burger = document.getElementById('burger');
const mainNav = document.getElementById('mainNav');
burger.addEventListener('click', ()=>{
  burger.classList.toggle('open');
  mainNav.classList.toggle('open');
});
mainNav.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', ()=>{
    burger.classList.remove('open');
    mainNav.classList.remove('open');
  });
});

// ============ scroll reveal ============
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold:0.15, rootMargin:'0px 0px -60px 0px' });
revealEls.forEach(el=>revealObserver.observe(el));

// ============ counters ============
const counters = document.querySelectorAll('.stat-number');
const counterObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold:0.5 });
counters.forEach(el=>counterObserver.observe(el));

// ============ cursor glow ============
const glow = document.getElementById('cursorGlow');
if(window.matchMedia('(pointer:fine)').matches){
  window.addEventListener('pointermove', (e)=>{
    glow.style.setProperty('--x', e.clientX + 'px');
    glow.style.setProperty('--y', e.clientY + 'px');
  }, { passive:true });
}

// ============ contact form (demo submit) ============
const form = document.getElementById('contactForm');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"] span');
  const original = btn.textContent;
  btn.textContent = 'Enviado ✓ (demo)';
  form.querySelector('button').style.opacity = '.6';
  setTimeout(()=>{ btn.textContent = original; form.querySelector('button').style.opacity = '1'; }, 2200);
});

// ============ footer year ============
document.getElementById('year').textContent = new Date().getFullYear();
