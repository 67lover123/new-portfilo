/* Portfolio script: navigation, theme, reveal, filter, modal, and edit mode. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = 'student-portfolio-v1', PHOTO = 'student-portfolio-photo', THEME = 'student-portfolio-theme';
  const html = document.documentElement, body = document.body;
  html.classList.add('js');

  /* Safe storage helpers (storage can be blocked in some browsers) */
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const del = k => { try { localStorage.removeItem(k); } catch {} };

  /* Toast */
  const toastEl = $('#toast'); let tt;
  const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2600); };

  /* Restore saved content */
  try { const saved = JSON.parse(get(KEY) || '{}'); $$('[data-store]').forEach(el => { if (saved[el.dataset.store] != null) el.innerHTML = saved[el.dataset.store]; }); } catch {}
  const saveAll = () => { const d = {}; $$('[data-store]').forEach(el => d[el.dataset.store] = el.innerHTML); set(KEY, JSON.stringify(d)); };
  let st; const saveSoon = () => { clearTimeout(st); st = setTimeout(saveAll, 400); };

  /* Theme */
  const applyTheme = t => { html.dataset.theme = t; };
  applyTheme(get(THEME) || 'dark');
  $('#themeBtn').addEventListener('click', () => { const t = html.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); set(THEME, t); });

  /* Mobile menu + header */
  const burger = $('#burger'), links = $('#links');
  const closeMenu = () => { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  links.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) closeMenu(); });
  const nav = $('#nav'), topBtn = $('#top');
  const onScroll = () => { nav.classList.toggle('solid', scrollY > 20); topBtn.classList.toggle('show', scrollY > 600); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* Scroll reveal + active nav link */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('.links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));
  $('#year').textContent = new Date().getFullYear();

  /* Project filter: buttons are built from the subjects found on the cards */
  const filters = $('#filters'); let current = 'All';
  const applyFilter = () => $$('.project').forEach(c => { const s = $('.subject', c)?.textContent.trim(); c.classList.toggle('hide', current !== 'All' && s !== current); });
  const buildFilters = () => {
    const subs = ['All', ...new Set($$('.project .subject').map(e => e.textContent.trim()).filter(Boolean))];
    if (!subs.includes(current)) current = 'All';
    filters.innerHTML = '';
    subs.forEach(s => { const b = document.createElement('button'); b.textContent = s; b.setAttribute('aria-pressed', s === current); b.addEventListener('click', () => { current = s; buildFilters(); }); filters.append(b); });
    applyFilter();
  };
  buildFilters();

  /* Project details dialog */
  const dlg = $('#dlg');
  const closeDlg = () => dlg.close ? dlg.close() : dlg.removeAttribute('open');
  $('#dClose').addEventListener('click', closeDlg);
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  document.addEventListener('click', e => {
    const v = e.target.closest('.view'); if (!v) return;
    const c = v.closest('.project'), t = s => $(s, c).textContent;
    $('#dTitle').textContent = t('h3'); $('#dSubject').textContent = t('.subject');
    $('#dDate').textContent = t('.meta'); $('#dDesc').textContent = t('.desc'); $('#dThumb').textContent = t('.thumb');
    dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  });

  /* Edit mode */
  const editBtn = $('#editBtn'), bar = $('#editbar');
  const setEditable = on => $$('[data-e]').forEach(el => on ? el.setAttribute('contenteditable', 'true') : el.removeAttribute('contenteditable'));
  const toggleEdit = () => {
    const on = !body.classList.contains('editing');
    body.classList.toggle('editing', on); bar.hidden = !on; editBtn.classList.toggle('on', on);
    editBtn.textContent = on ? 'Done' : 'Edit'; setEditable(on);
    if (!on) { saveAll(); buildFilters(); toast('Saved in this browser'); }
  };
  editBtn.addEventListener('click', toggleEdit);
  document.addEventListener('input', e => { if (e.target.closest('[data-store]')) saveSoon(); });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[contenteditable] ') && e.target.closest('h1,h2,h3,.chip,.mail,.brand')) e.preventDefault(); });
  $('#resetBtn').addEventListener('click', () => { if (confirm('Reset all text and photo back to the original placeholders?')) { del(KEY); del(PHOTO); location.reload(); } });

  /* Add / remove items */
  const targets = { skill: ['#t-skill', '#skillGrid'], hobby: ['#t-hobby', '#chipList'], ach: ['#t-ach', '#achList'], project: ['#t-project', '#projectGrid'] };
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { const [t, c] = targets[add.dataset.add]; $(c).append($(t).content.cloneNode(true)); setEditable(true); buildFilters(); saveAll(); return; }
    const rm = e.target.closest('.remove');
    if (rm && body.classList.contains('editing')) { rm.closest('.removable').remove(); buildFilters(); saveAll(); }
  });

  /* Profile photo (resized and kept in this browser only) */
  const photo = $('#photo');
  const showPhoto = src => { photo.innerHTML = ''; const i = new Image(); i.src = src; i.alt = 'Profile photo'; photo.append(i); photo.removeAttribute('role'); photo.removeAttribute('aria-label'); };
  const savedPhoto = get(PHOTO); if (savedPhoto) showPhoto(savedPhoto);
  $('#photoInput').addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const s = Math.min(600, img.width, img.height), c = document.createElement('canvas'); c.width = c.height = s;
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, s, s);
      const url = c.toDataURL('image/jpeg', .85); showPhoto(url); set(PHOTO, url); toast('Photo updated');
    }; img.src = r.result; };
    r.readAsDataURL(f);
  });

  /* Contact: email, social links, PDF profile */
  $('#mailBtn').addEventListener('click', () => {
    const m = $('#mailText').textContent.trim();
    if (!/^\S+@\S+\.\S+$/.test(m) || m.endsWith('@example.com')) return toast('Add your real email first (Edit mode).');
    location.href = 'mailto:' + m;
  });
  $('#cvBtn').addEventListener('click', () => { toast('Choose “Save as PDF” in the print window'); setTimeout(print, 700); });
  $('#socials').addEventListener('click', e => {
    const b = e.target.closest('.social'); if (!b) return;
    if (body.classList.contains('editing')) {
      const u = prompt('Paste the full link for ' + b.textContent + ' (leave empty to clear):', b.dataset.url || 'https://');
      if (u !== null) { b.dataset.url = /^https?:\/\//i.test(u.trim()) ? u.trim() : ''; saveAll(); }
    } else if (b.dataset.url) open(b.dataset.url, '_blank', 'noopener');
    else toast('No link yet. Turn on Edit mode to add one.');
  });
})();
