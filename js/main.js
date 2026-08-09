/* ============================================================
   LOOPED — main.js
   ============================================================ */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ============ preloader ============ */
(function preloader(){
  const pre = $('#preloader');
  if(!pre) return;
  const bar = $('#preBar');
  const count = $('#preCount');
  const hero = $('#hero');
  const seen = sessionStorage.getItem('lp_seen') === '1';

  function finish(){
    pre.classList.add('done');
    document.body.classList.remove('is-locked');
    if(hero) hero.classList.add('loaded');
    setTimeout(()=> pre.remove(), 800);
  }

  if(seen || REDUCED){
    pre.style.transition = 'none';
    finish();
    return;
  }

  document.body.classList.add('is-locked');
  sessionStorage.setItem('lp_seen', '1');
  let p = 0;
  const timer = setInterval(()=>{
    p = Math.min(p + Math.random() * 18 + 6, 100);
    if(bar) bar.style.width = p + '%';
    if(count) count.textContent = String(Math.round(p)).padStart(2, '0');
    if(p >= 100){
      clearInterval(timer);
      setTimeout(finish, 260);
    }
  }, 110);
  // red de seguridad, nunca dejamos la pantalla bloqueada
  setTimeout(()=>{ clearInterval(timer); finish(); }, 3200);
})();

/* ============ header: sombra + auto-ocultar ============ */
(function header(){
  const el = $('#siteHeader');
  if(!el) return;
  let last = window.scrollY;
  const nav = $('#mainNav');
  const onScroll = ()=>{
    const y = window.scrollY;
    el.classList.toggle('scrolled', y > 40);
    const menuOpen = nav && nav.classList.contains('open');
    el.classList.toggle('hidden', y > 420 && y > last && !menuOpen);
    last = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();

/* ============ barra de progreso ============ */
(function progress(){
  const bar = $('#scrollProgress');
  if(!bar) return;
  const update = ()=>{
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
  };
  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update);
})();

/* ============ menú móvil ============ */
(function mobileMenu(){
  const burger = $('#burger');
  const nav = $('#mainNav');
  if(!burger || !nav) return;
  const close = ()=>{
    burger.classList.remove('open');
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  };
  burger.addEventListener('click', ()=>{
    const open = burger.classList.toggle('open');
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('is-locked', open);
  });
  $$('a', nav).forEach(a=> a.addEventListener('click', close));
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });
})();

/* ============ reveal al hacer scroll ============ */
(function reveal(){
  const els = $$('.reveal');
  if(!els.length) return;
  if(REDUCED || !('IntersectionObserver' in window)){
    els.forEach(el=> el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold:0.12, rootMargin:'0px 0px -70px 0px' });
  els.forEach(el=> io.observe(el));
})();

/* ============ contadores ============ */
(function counters(){
  const els = $$('.stat-number');
  if(!els.length) return;
  if(REDUCED || !('IntersectionObserver' in window)){
    els.forEach(el=> el.textContent = el.dataset.count);
    return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const start = performance.now();
      const dur = 1500;
      (function tick(now){
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if(p < 1) requestAnimationFrame(tick);
      })(start);
      io.unobserve(el);
    });
  }, { threshold:0.5 });
  els.forEach(el=> io.observe(el));
})();

/* ============ hero: slideshow + indicador de bucle ============ */
(function heroSlider(){
  const wrap = $('#heroSlides');
  if(!wrap) return;
  const slides = $$('.hero-slide', wrap);
  const dotsWrap = $('#heroDots');
  const caption = $('#heroCaption');
  const hero = $('#hero');
  const loop = $('#heroLoop');
  const loopIdx = $('#loopIdx');
  const loopSep = loop && loop.querySelector('.sep');
  if(hero) hero.classList.add('loaded');
  if(slides.length < 2 && dotsWrap) dotsWrap.remove();

  let i = 0, timer = null;
  const DELAY = 6200;

  if(loop){
    if(loopSep) loopSep.textContent = ' / ' + String(slides.length).padStart(2, '0');
    loop.style.setProperty('--loop-dur', (DELAY / 1000) + 's');
  }

  const dots = slides.map((s, idx)=>{
    if(!dotsWrap) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Imagen ' + (idx + 1) + ' de ' + slides.length);
    if(idx === 0) b.classList.add('on');
    b.addEventListener('click', ()=>{ go(idx); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  // el anillo se cierra justo cuando toca cambiar de imagen
  function spinRing(){
    if(loopIdx) loopIdx.textContent = String(i + 1).padStart(2, '0');
    if(!loop || REDUCED || slides.length < 2) return;
    loop.classList.remove('run');
    void loop.offsetWidth;
    loop.classList.add('run');
  }

  function go(n){
    slides[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    const s = slides[i];
    s.classList.add('active');
    // reinicia el ken burns
    const img = s.querySelector('img');
    if(img && !REDUCED){ img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
    dots.forEach((d, idx)=> d && d.classList.toggle('on', idx === i));
    if(caption){
      const place = s.dataset.place || '';
      const city = s.dataset.city || '';
      caption.textContent = city ? place + ', ' + city : place;
    }
    spinRing();
  }
  function restart(){
    clearInterval(timer);
    if(!REDUCED && slides.length > 1) timer = setInterval(()=> go(i + 1), DELAY);
  }
  spinRing();
  restart();
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ clearInterval(timer); if(loop) loop.classList.remove('run'); }
    else { restart(); spinRing(); }
  });
})();

/* ============ proceso: línea de sesión con cabezal ============ */
(function dawTimeline(){
  const daw = $('#daw');
  if(!daw) return;
  const clips = $$('.daw-clip', daw);
  const nowEl = $('#dawNow');
  const pctEl = $('#dawPct');
  const names = clips.map(c => (c.querySelector('.mono')?.textContent || '').split('·').pop().trim());

  // ondas deterministas, para que no bailen entre recargas
  $$('.daw-wave', daw).forEach(wave=>{
    let seed = parseInt(wave.dataset.seed, 10) || 1;
    const rnd = ()=>{ seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const bars = 34;
    let html = '';
    for(let b = 0; b < bars; b++){
      const env = Math.sin((b / (bars - 1)) * Math.PI);          // sobre suave
      const h = Math.max(8, Math.round((0.28 + rnd() * 0.72) * env * 100));
      html += '<b style="height:' + h + '%"></b>';
    }
    wave.innerHTML = html;
  });

  let ticking = false;
  function update(){
    ticking = false;
    const r = daw.getBoundingClientRect();
    const vh = window.innerHeight;
    const span = r.height * 0.9 + vh * 0.15;
    const p = Math.max(0, Math.min((vh * 0.78 - r.top) / span, 1));
    daw.style.setProperty('--play', p);

    const idx = Math.min(clips.length - 1, Math.floor(p * clips.length));
    clips.forEach((c, n)=>{
      c.classList.toggle('on', n === idx && p > 0);
      c.classList.toggle('done', n < idx || (p >= 1 && n === idx));
    });
    if(nowEl) nowEl.textContent = p <= 0 ? 'En espera' : names[idx];
    if(pctEl) pctEl.textContent = String(Math.round(p * 100)).padStart(2, '0') + ' %';
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }

  if(REDUCED){
    daw.style.setProperty('--play', 1);
    clips.forEach(c=> c.classList.add('on'));
    if(nowEl) nowEl.textContent = names[names.length - 1];
    if(pctEl) pctEl.textContent = '100 %';
    return;
  }
  update();
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
})();

/* ============ artistas: carrusel anclado al scroll vertical ============ */
(function pinnedRail(){
  const section = $('#artistas');
  const rail = $('#pinRail');
  if(!section || !rail || !section.classList.contains('pin')) return;

  const progress = $('#pinProgress');
  const hint = $('#pinHint');
  const mq = window.matchMedia('(min-width: 761px)');
  let distance = 0, ticking = false;

  function measure(){
    if(!mq.matches || REDUCED){
      section.style.height = '';
      rail.style.transform = '';
      if(progress) progress.style.setProperty('--rail', 0);
      if(hint) hint.textContent = 'Desliza para ver el roster completo';
      distance = 0;
      return;
    }
    if(hint) hint.textContent = 'Sigue bajando para recorrer el roster';
    rail.style.transform = 'translate3d(0,0,0)';
    const overflow = rail.scrollWidth - window.innerWidth;
    distance = Math.max(0, overflow);
    section.style.height = (window.innerHeight + distance) + 'px';
    apply();
  }

  function apply(){
    ticking = false;
    if(!distance) return;
    const r = section.getBoundingClientRect();
    const p = Math.max(0, Math.min(-r.top / (r.height - window.innerHeight), 1));
    rail.style.transform = 'translate3d(' + (-p * distance) + 'px,0,0)';
    if(progress) progress.style.setProperty('--rail', p);
    if(hint) hint.textContent = p >= 0.995
      ? 'Roster completo, seguimos bajando'
      : 'Sigue bajando para recorrer el roster';
  }

  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(apply); } }

  measure();
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if(mq.addEventListener) mq.addEventListener('change', measure);
})();

/* ============ reajuste de anclaje ============
   Las fuentes y las imágenes cambian el alto de la página después del salto
   inicial, así que volvemos a colocarnos sobre la sección cuando todo asienta. */
(function hashAnchor(){
  if(!location.hash) return;
  let done = false;
  const settle = ()=>{
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(!target) return;
    const behavior = done ? 'smooth' : 'auto';
    done = true;
    target.scrollIntoView({ behavior:REDUCED ? 'auto' : behavior });
  };
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=> setTimeout(settle, 80));
  window.addEventListener('load', ()=> setTimeout(settle, 160));
})();

/* ============ tarjetas de servicio con foto al pasar el ratón ============ */
(function serviceMedia(){
  $$('.service-card[data-media]').forEach(card=>{
    const url = card.dataset.media;
    if(!url) return;
    // URL absoluta, si no el navegador resuelve la ruta relativa contra la hoja de estilos
    card.style.setProperty('--media', 'url("' + new URL(url, document.baseURI).href + '")');
  });
})();

/* ============ Open Air Series ============ */
(function openAir(){
  const list = $('#oaList');
  const stage = $('#oaStage');
  if(!list || !stage) return;
  const items = $$('.oa-item', list);
  const placeEl = $('#oaPlace');
  const cityEl = $('#oaCity');
  let current = stage.querySelector('img');
  let loading = null;

  function show(btn){
    if(btn.classList.contains('on')) return;
    items.forEach(b=> b.classList.remove('on'));
    btn.classList.add('on');
    if(placeEl) placeEl.textContent = btn.dataset.place || '';
    if(cityEl) cityEl.textContent = btn.dataset.city || '';

    const src = btn.dataset.img;
    if(!src || loading === src) return;
    loading = src;
    const next = new Image();
    next.src = src;
    next.alt = 'Open Air Series en ' + (btn.dataset.place || '') + ', ' + (btn.dataset.city || '');
    next.loading = 'eager';
    const swap = ()=>{
      if(loading !== src) return;
      stage.insertBefore(next, stage.firstChild);
      requestAnimationFrame(()=> next.classList.add('on'));
      const old = current;
      current = next;
      if(old){
        old.classList.remove('on');
        setTimeout(()=> old.remove(), 800);
      }
    };
    if(next.complete) swap(); else next.onload = swap;
  }

  // al hacer scroll la lista pasa por debajo del cursor y dispara mouseenter,
  // así que solo cambiamos de foto si el ratón se ha movido de verdad y no venimos de un scroll
  const born = performance.now();
  let lastMove = 0, lastScroll = 0, lastX = null, lastY = null;
  window.addEventListener('pointermove', e=>{
    if(e.clientX === lastX && e.clientY === lastY) return;
    lastX = e.clientX; lastY = e.clientY; lastMove = performance.now();
  }, { passive:true });
  window.addEventListener('scroll', ()=>{ lastScroll = performance.now(); }, { passive:true });

  items.forEach(btn=>{
    btn.addEventListener('click', ()=> show(btn));
    btn.addEventListener('mouseenter', ()=>{
      if(!window.matchMedia('(pointer:fine)').matches) return;
      const now = performance.now();
      if(now - born < 1200) return;   // margen al cargar
      if(lastMove <= lastScroll) return;  // se movió la lista, no el ratón
      if(now - lastMove > 500) return;
      show(btn);
    });
    // solo con teclado, para que un foco automático al cargar no cambie la foto
    btn.addEventListener('focus', ()=>{
      if(btn.matches(':focus-visible')) show(btn);
    });
  });

  // precarga suave del resto de imágenes cuando la sección entra en pantalla
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries=>{
      if(entries.some(e=> e.isIntersecting)){
        items.forEach(b=>{ const im = new Image(); im.src = b.dataset.img; });
        io.disconnect();
      }
    }, { rootMargin:'300px' });
    io.observe(list);
  }
})();

/* ============ FAQ ============ */
(function faq(){
  $$('.faq-item').forEach(item=>{
    const q = $('.faq-q', item);
    const a = $('.faq-a', item);
    if(!q || !a) return;
    const inner = $('.faq-a-inner', a);
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', ()=>{
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.height = open ? inner.offsetHeight + 'px' : '0px';
    });
  });
  window.addEventListener('resize', ()=>{
    $$('.faq-item.open').forEach(item=>{
      const a = $('.faq-a', item);
      const inner = $('.faq-a-inner', item);
      if(a && inner) a.style.height = inner.offsetHeight + 'px';
    });
  });
})();

/* ============ cursor glow ============ */
(function glow(){
  const el = $('#cursorGlow');
  if(!el) return;
  if(!window.matchMedia('(pointer:fine)').matches || REDUCED){ el.remove(); return; }
  window.addEventListener('pointermove', e=>{
    el.style.setProperty('--x', e.clientX + 'px');
    el.style.setProperty('--y', e.clientY + 'px');
  }, { passive:true });
})();

/* ============ select personalizado ============ */
$$('.field select').forEach(nativeSelect=>{
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
    .filter(opt=> opt.value !== '')
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

  let activeIndex = items.findIndex(li=> li.classList.contains('selected'));

  function setActive(index){
    items.forEach(li=> li.classList.remove('active'));
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
  function onOutsideClick(e){ if(!shell.contains(e.target)) closePanel(); }
  function selectItem(li){
    items.forEach(o=> o.classList.remove('selected'));
    li.classList.add('selected');
    textEl.textContent = li.textContent;
    nativeSelect.value = li.dataset.value;
    nativeSelect.dispatchEvent(new Event('change', { bubbles:true }));
    closePanel();
    trigger.focus();
  }

  trigger.addEventListener('click', e=>{
    e.stopPropagation();
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  trigger.addEventListener('focus', ()=> field.classList.add('select-focus'));
  trigger.addEventListener('blur', ()=>{ if(!panel.classList.contains('open')) field.classList.remove('select-focus'); });
  trigger.addEventListener('keydown', e=>{
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

/* ============ tarjetas de equipo (flip) ============ */
$$('.team-card[data-flip]').forEach(card=>{
  if(card.tagName !== 'BUTTON'){
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
  }
  card.setAttribute('aria-pressed', 'false');
  const toggle = ()=>{
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e=>{
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
  });
});

/* ============ contador de caracteres ============ */
(function charCount(){
  const ta = $('#f-mensaje');
  const out = $('#charCount');
  if(!ta || !out) return;
  const max = ta.getAttribute('maxlength') || 600;
  const update = ()=> out.textContent = ta.value.length + ' / ' + max;
  ta.addEventListener('input', update);
  update();
})();

/* ============ formulario (maqueta) ============ */
(function contactForm(){
  const form = $('#contactForm');
  if(!form) return;
  const status = $('#formStatus');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', e=>{
    e.preventDefault();
    if(status){ status.textContent = ''; status.className = 'form-status'; }

    if(!form.checkValidity()){
      const bad = form.querySelector(':invalid');
      if(status){
        status.textContent = 'Falta algún campo obligatorio, revísalo y volvemos a intentarlo.';
        status.className = 'form-status err';
      }
      if(bad && bad.focus) bad.focus();
      return;
    }

    const label = btn.querySelector('span');
    const original = label.textContent;
    label.textContent = 'Enviando…';
    btn.disabled = true;

    setTimeout(()=>{
      label.textContent = original;
      btn.disabled = false;
      if(status){
        status.textContent = 'Mensaje registrado en la maqueta. Todavía no se envía de verdad, escríbenos por email mientras tanto.';
        status.className = 'form-status ok';
      }
    }, 900);
  });
})();

/* ============ marcar el enlace de nav activo ============ */
(function activeNav(){
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.main-nav a').forEach(a=>{
    const href = a.getAttribute('href') || '';
    if(href === page && !href.startsWith('#')) a.classList.add('is-current');
  });
})();

/* ============ año del footer ============ */
(function year(){
  const el = $('#year');
  if(el) el.textContent = new Date().getFullYear();
})();
