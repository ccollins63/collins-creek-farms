/* ==========================================================================
   Collins Creek Farms — main.js
   Handles: partial loading (header/footer), mobile nav, active-link highlight,
   animal rendering from data/animals.json, filtering, lightbox, footer year.
   ========================================================================== */

(() => {
  const PLACEHOLDER_IMG = '/assets/images/placeholder-animal.svg';

  /* ---------- Utilities ---------- */
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Capitalize first letter */
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  /* Format YYYY-MM-DD as "Jan 5, 2026" */
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ---------- Partial loader ---------- */
  async function loadPartial(placeholderSelector, url) {
    const el = qs(placeholderSelector);
    if (!el) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
    }
  }

  /* ---------- Active nav + mobile toggle ---------- */
  function initHeaderBehavior() {
    const header = qs('.site-header');
    if (!header) return;

    /* Active link highlight — matches first path segment, e.g. "/about/" -> "about" */
    const seg = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    const map = {
      '': 'home',
      'about': 'about',
      'animals': 'animals',
      'cows': 'animals',
      'chickens': 'animals',
      'farmstand': 'farmstand',
      'contact': 'contact',
    };
    const active = map[seg];
    qsa('[data-nav]', header).forEach((el) => {
      if (el.dataset.nav === active) el.classList.add('is-active');
    });

    /* Mobile toggle */
    const toggle = qs('.nav-toggle', header);
    const nav = qs('.primary-nav', header);
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      /* Close drawer when a leaf link is tapped */
      qsa('.primary-nav a', header).forEach((a) => {
        a.addEventListener('click', () => {
          if (a.closest('.has-submenu__trigger') || a.classList.contains('has-submenu__trigger')) return;
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Mobile submenu expand */
    qsa('.has-submenu', header).forEach((item) => {
      const trigger = qs('.has-submenu__trigger', item);
      if (!trigger) return;
      trigger.addEventListener('click', (e) => {
        if (window.matchMedia('(max-width: 900px)').matches) {
          e.preventDefault();
          item.classList.toggle('is-open');
          trigger.setAttribute('aria-expanded', String(item.classList.contains('is-open')));
        }
      });
    });
  }

  /* ---------- Footer year ---------- */
  function initFooter() {
    const year = qs('[data-current-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ==========================================================================
     Animals: load + render
     ========================================================================== */
  let animalsCache = null;
  async function loadAnimals() {
    if (animalsCache) return animalsCache;
    const res = await fetch('/data/animals.json');
    if (!res.ok) throw new Error(`Failed to load animals.json: ${res.status}`);
    const data = await res.json();
    animalsCache = data.animals || [];
    return animalsCache;
  }

  /* Assign fallback display name per species: "Cow #1", "Chicken #2"... */
  function assignFallbackNames(animals) {
    const counters = {};
    const byId = Object.fromEntries(animals.map(a => [a.id, a]));
    return animals.map((a) => {
      const displayName = a.name && a.name.trim()
        ? a.name
        : (() => {
            const s = a.species || 'animal';
            counters[s] = (counters[s] || 0) + 1;
            return `${cap(s)} #${counters[s]}`;
          })();
      return { ...a, _displayName: displayName, _isUnnamed: !a.name, _mother: a.motherId ? byId[a.motherId] : null };
    });
  }

  function animalMetaLine(animal) {
    const parts = [];
    if (animal.type) parts.push(cap(animal.type));
    if (animal._mother) {
      const mom = animal._mother._displayName || animal._mother.name || cap(animal._mother.species);
      parts.push(`Mama: ${mom}`);
    }
    return parts.join(' · ');
  }

  function renderCard(animal) {
    const src = animal.image || PLACEHOLDER_IMG;
    const card = document.createElement('article');
    card.className = 'animal-card';
    card.dataset.species = animal.species || '';
    card.dataset.type = animal.type || '';
    card.innerHTML = `
      <div class="animal-card__media">
        <img src="${src}" alt="${animal._displayName}"
             loading="lazy"
             onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
      </div>
      <div class="animal-card__body">
        <div class="animal-card__name ${animal._isUnnamed ? 'animal-card__name--placeholder' : ''}">${animal._displayName}</div>
        <div class="animal-card__meta">${animalMetaLine(animal)}</div>
        ${animal.dob ? `<div class="animal-card__dob">Born ${formatDate(animal.dob)}</div>` : ''}
        ${animal.notes ? `<div class="animal-card__notes">${animal.notes}</div>` : ''}
      </div>
    `;
    return card;
  }

  /* Filter by species ("cow"|"chicken"|"all") and/or type ("calf"|"chick"|etc) */
  function filterAnimals(animals, { species, type } = {}) {
    return animals.filter((a) => {
      if (species && species !== 'all' && a.species !== species) return false;
      if (type && type !== 'all' && a.type !== type) return false;
      return true;
    });
  }

  async function renderAnimalGrid(grid) {
    const species = grid.dataset.species || 'all';
    const defaultFilter = grid.dataset.defaultFilter || 'all';

    const raw = await loadAnimals();
    const animals = assignFallbackNames(raw);
    const scoped = filterAnimals(animals, { species: species === 'all' ? undefined : species });

    const render = (typeFilter) => {
      grid.innerHTML = '';
      const filtered = filterAnimals(scoped, { type: typeFilter });
      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'animal-grid__empty';
        empty.textContent = 'No animals to show yet — check back soon.';
        grid.appendChild(empty);
        return;
      }
      const frag = document.createDocumentFragment();
      filtered.forEach((a) => frag.appendChild(renderCard(a)));
      grid.appendChild(frag);
    };

    /* Wire up filter buttons scoped to this grid's container */
    const container = grid.closest('[data-animal-section]') || grid.parentElement;
    const filterButtons = qsa('.filter-btn', container);
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        render(btn.dataset.filter);
      });
    });

    /* Mark default and render */
    const defaultBtn = filterButtons.find((b) => b.dataset.filter === defaultFilter);
    if (defaultBtn) {
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      defaultBtn.classList.add('is-active');
    }
    render(defaultFilter);
  }

  /* ==========================================================================
     Lightbox (applies to .animal-card__media img and any [data-lightbox] img)
     ========================================================================== */
  function initLightbox() {
    const lightbox = qs('.lightbox');
    if (!lightbox) return;
    const imgEl = qs('.lightbox__img', lightbox);
    const caption = qs('.lightbox__caption', lightbox);

    let images = [];
    let idx = 0;

    function refreshImages() {
      images = qsa('.animal-card__media img, [data-lightbox] img').filter(
        (img) => !img.src.endsWith('placeholder-animal.svg')
      );
    }

    function show(i) {
      if (!images.length) return;
      idx = (i + images.length) % images.length;
      imgEl.src = images[idx].src;
      imgEl.alt = images[idx].alt || '';
      caption.textContent = images[idx].alt || '';
      lightbox.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    }
    function hide() {
      lightbox.classList.remove('is-active');
      document.body.style.overflow = '';
    }

    document.addEventListener('click', (e) => {
      const img = e.target.closest('.animal-card__media img, [data-lightbox] img');
      if (!img) return;
      if (img.src.endsWith('placeholder-animal.svg')) return;
      refreshImages();
      const i = images.indexOf(img);
      if (i >= 0) show(i);
    });

    qs('.lightbox__close', lightbox)?.addEventListener('click', hide);
    qs('.lightbox__prev', lightbox)?.addEventListener('click', () => show(idx - 1));
    qs('.lightbox__next', lightbox)?.addEventListener('click', () => show(idx + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) hide(); });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', async () => {
    /* 1. Load header + footer partials, then wire up behavior */
    await Promise.all([
      loadPartial('.site-header', '/partials/header.html'),
      loadPartial('.site-footer', '/partials/footer.html'),
    ]);
    initHeaderBehavior();
    initFooter();

    /* 2. Render any animal grids on the page */
    const grids = qsa('[data-animal-grid]');
    for (const grid of grids) {
      try {
        await renderAnimalGrid(grid);
      } catch (err) {
        console.error('Failed to render animal grid:', err);
        grid.innerHTML = '<div class="animal-grid__empty">Could not load animals. Refresh to try again.</div>';
      }
    }

    /* 3. Lightbox */
    initLightbox();
  });
})();
