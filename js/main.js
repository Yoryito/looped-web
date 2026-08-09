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

// ============ custom select (themed replacement for native <select> popup) ============
document.querySelectorAll('.field select').forEach(nativeSelect=>{
  const field = nativeSelect.closest('.field');

  const shell = document.createElement('div');
  shell.className = 'select-shell';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  const triggerId = nativeSelect.id ? nativeSelect.id + '-trigger' : '';
  if(triggerId) trigger.id = triggerId;

  const textEl = document.createElement('span');
  textEl.className = 'select-trigger-text';
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('class', 'select-chevron');
  chevron.setAttribute('viewBox', '0 0 16 16');
  chevron.setAttribute('width', '14');
  chevron.setAttribute('height', '14');
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = '<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  trigger.appendChild(textEl);
  trigger.appendChild(chevron);

  const panel = document.createElement('ul');
  panel.className = 'select-panel';
  panel.setAttribute('role', 'listbox');
  panel.tabIndex = -1;
  if(triggerId) panel.setAttribute('aria-labelledby', triggerId);

  const items = Array.from(nativeSelect.options)
    .filter(opt=>opt.value !== '')
    .map(opt=>{
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      if(opt.selected){ li.classList.add('selected'); textEl.textContent = opt.textContent; }
      panel.appendChild(li);
      return li;
    });

  const label = field.querySelector('label[for="' + nativeSelect.id + '"]');
  if(label && triggerId) label.setAttribute('for', triggerId);

  nativeSelect.classList.add('select-native');
  nativeSelect.tabIndex = -1;
  nativeSelect.setAttribute('aria-hidden', 'true');

  field.insertBefore(shell, nativeSelect);
  shell.appendChild(trigger);
  shell.appendChild(panel);
  shell.appendChild(nativeSelect);

  let activeIndex = items.findIndex(li=>li.classList.contains('selected'));

  function setActive(index){
    items.forEach(li=>li.classList.remove('active'));
    if(index >= 0 && index < items.length){
      activeIndex = index;
      items[index].classList.add('active');
      items[index].scrollIntoView({ block:'nearest' });
    }
  }

  function openPanel(){
    panel.classList.add('open');
    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    field.classList.add('select-focus');
    setActive(activeIndex >= 0 ? activeIndex : 0);
    document.addEventListener('click', onOutsideClick);
  }
  function closePanel(){
    panel.classList.remove('open');
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    field.classList.remove('select-focus');
    document.removeEventListener('click', onOutsideClick);
  }
  function onOutsideClick(e){
    if(!shell.contains(e.target)) closePanel();
  }
  function selectItem(li){
    items.forEach(o=>o.classList.remove('selected'));
    li.classList.add('selected');
    textEl.textContent = li.textContent;
    nativeSelect.value = li.dataset.value;
    nativeSelect.dispatchEvent(new Event('change', { bubbles:true }));
    closePanel();
    trigger.focus();
  }

  trigger.addEventListener('click', (e)=>{
    e.stopPropagation();
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  trigger.addEventListener('focus', ()=> field.classList.add('select-focus'));
  trigger.addEventListener('blur', ()=>{ if(!panel.classList.contains('open')) field.classList.remove('select-focus'); });
  trigger.addEventListener('keydown', (e)=>{
    if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)) e.preventDefault();
    if(!panel.classList.contains('open') && ['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){ openPanel(); return; }
    if(e.key === 'ArrowDown') setActive(Math.min(activeIndex + 1, items.length - 1));
    else if(e.key === 'ArrowUp') setActive(Math.max(activeIndex - 1, 0));
    else if(e.key === 'Enter' && activeIndex >= 0) selectItem(items[activeIndex]);
    else if(e.key === 'Escape'){ closePanel(); trigger.focus(); }
  });

  items.forEach((li, i)=>{
    li.addEventListener('click', ()=> selectItem(li));
    li.addEventListener('mouseenter', ()=> setActive(i));
  });
});

// ============ team flip cards ============
document.querySelectorAll('.team-card[data-flip]').forEach(card=>{
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');
  const toggle = ()=>{
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
  });
});

// ============ contact form (demo submit) ============
const form = document.getElementById('contactForm');
if(form){
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"] span');
    const original = btn.textContent;
    btn.textContent = 'Enviado ✓ (demo)';
    form.querySelector('button').style.opacity = '.6';
    setTimeout(()=>{ btn.textContent = original; form.querySelector('button').style.opacity = '1'; }, 2200);
  });
}

// ============ footer year ============
document.getElementById('year').textContent = new Date().getFullYear();
