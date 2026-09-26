const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menu?.addEventListener('click', () => nav.classList.toggle('open'));

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

const copyBtn = document.getElementById('copyEmail');
copyBtn?.addEventListener('click', async () => {
  const email = 'isunurilaxmansai@gmail.com';
  try {
    await navigator.clipboard.writeText(email);
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => copyBtn.textContent = 'Copy email', 1600);
  } catch {
    copyBtn.textContent = email;
  }
});

const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('.nav a')];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });

sections.forEach(section => observer.observe(section));

const aiGallery = document.getElementById('aiGallery');

// Lightbox: the image grows out of its card, and shrinks back into it on close.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lightbox = null;

const toFrame = rect => ({
  left: `${rect.left}px`, top: `${rect.top}px`,
  width: `${rect.width}px`, height: `${rect.height}px`
});

function fitToViewport(img) {
  const scale = Math.min(innerWidth * 0.92 / img.naturalWidth, innerHeight * 0.88 / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  return { left: (innerWidth - width) / 2, top: (innerHeight - height) / 2, width, height };
}

function zoom(el, from, to, timing = {}) {
  Object.assign(el.style, to);
  return el.animate([from, to], reducedMotion.matches ? { duration: 0 } : {
    duration: 450,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fill: 'backwards',
    ...timing
  });
}

function openLightbox(slot) {
  const thumb = slot.querySelector('img');
  if (lightbox || !thumb?.naturalWidth) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.tabIndex = -1;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', thumb.alt);
  overlay.innerHTML = '<div class="lightbox-backdrop"></div>';
  const image = thumb.cloneNode();
  image.className = 'lightbox-img';
  image.draggable = false;
  image.removeAttribute('loading');
  // Start from the already-loaded thumbnail, then swap in the full-size image once it arrives.
  if (thumb.dataset.full) {
    const full = new Image();
    full.onload = () => { image.src = full.src; };
    full.src = thumb.dataset.full;
  }
  overlay.append(image);
  document.body.append(overlay);

  overlay.addEventListener('click', closeLightbox);
  overlay.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  slot.classList.add('is-expanded');
  lightbox = { overlay, image, slot, thumb, closing: false };

  zoom(overlay.firstChild, { opacity: 0 }, { opacity: 1 });
  zoom(image,
    { ...toFrame(thumb.getBoundingClientRect()), borderRadius: '8px' },
    { ...toFrame(fitToViewport(thumb)), borderRadius: '14px' });
  overlay.focus({ preventScroll: true });
}

async function closeLightbox() {
  if (!lightbox || lightbox.closing) return;
  lightbox.closing = true;
  const { overlay, image, slot, thumb } = lightbox;
  const backdrop = overlay.firstChild;

  // Start from wherever the image is right now, so closing mid-open doesn't jump.
  const current = { ...toFrame(image.getBoundingClientRect()), borderRadius: getComputedStyle(image).borderRadius };
  const fade = { opacity: getComputedStyle(backdrop).opacity };
  [image, backdrop].forEach(el => el.getAnimations().forEach(a => a.cancel()));

  zoom(backdrop, fade, { opacity: 0 });
  await zoom(image, current, { ...toFrame(thumb.getBoundingClientRect()), borderRadius: '8px' }).finished;

  slot.classList.remove('is-expanded');
  overlay.remove();
  lightbox = null;
  slot.focus({ preventScroll: true });
}

aiGallery?.addEventListener('click', event => {
  const slot = event.target.closest('.ai-slot');
  if (slot) openLightbox(slot);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeLightbox();
    closeProject();
  }
});

window.addEventListener('resize', () => {
  if (!lightbox || lightbox.closing) return;
  lightbox.image.getAnimations().forEach(a => a.finish());
  Object.assign(lightbox.image.style, toFrame(fitToViewport(lightbox.thumb)));
});

// Project cards: the card grows into a detail view, and shrinks back on close.
const projectTemplate = document.getElementById('projectViewTemplate');
let projectView = null;

function buildProjectView(card) {
  const overlay = projectTemplate.content.firstElementChild.cloneNode(true);
  const modal = overlay.querySelector('.project-modal');
  const visual = card.querySelector('.project-visual').cloneNode(true);
  const [title, subtitle, tags] = ['h3', 'p', 'small'].map(tag => card.querySelector(`:scope > ${tag}`));
  const details = card.querySelector('.project-details');
  const url = card.dataset.url?.trim();

  modal.classList.add(...[...card.classList].filter(name => name !== 'project-card'));
  modal.setAttribute('aria-label', title.textContent);
  overlay.querySelector('.pm-inner').prepend(visual);
  overlay.querySelector('.pm-summary').append(title.cloneNode(true), subtitle.cloneNode(true), tags.cloneNode(true));
  overlay.querySelector('.pm-title').textContent = title.textContent;
  overlay.querySelector('.pm-subtitle').textContent = subtitle.textContent;
  overlay.querySelector('.pm-tags').append(...tags.textContent.split('·').map(tag =>
    Object.assign(document.createElement('span'), { textContent: tag.trim() })));
  if (details) overlay.querySelector('.pm-description').append(...details.cloneNode(true).childNodes);

  const link = overlay.querySelector('.pm-link a');
  if (url) {
    link.href = url;
    link.textContent = `${url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗`;
  } else {
    link.parentElement.remove();
  }

  return {
    overlay, modal, visual,
    backdrop: overlay.querySelector('.lightbox-backdrop'),
    inner: overlay.querySelector('.pm-inner'),
    summary: overlay.querySelector('.pm-summary'),
    body: overlay.querySelector('.pm-body')
  };
}

function openProject(card) {
  if (projectView || lightbox) return;
  const view = buildProjectView(card);
  const { overlay, modal, visual, summary, body, backdrop } = view;
  document.body.append(overlay);

  // Measure the resting layout first, then animate into it from the card.
  const to = modal.getBoundingClientRect();
  const visualHeight = `${visual.offsetHeight}px`;
  body.style.width = `${body.offsetWidth}px`;
  summary.style.width = `${card.clientWidth}px`;
  const from = card.getBoundingClientRect();
  const cardVisualHeight = `${card.querySelector('.project-visual').offsetHeight}px`;

  modal.classList.add('is-animating');
  card.classList.add('is-expanded');
  projectView = { ...view, card, closing: false };

  overlay.addEventListener('click', event => {
    if (!modal.contains(event.target) || event.target.closest('.pm-close')) closeProject();
  });
  // Let the wheel scroll the card when it has overflow; never scroll the page behind.
  overlay.addEventListener('wheel', event => {
    const cardCanScroll = modal.contains(event.target) && !modal.classList.contains('is-animating')
      && modal.scrollHeight > modal.clientHeight;
    if (!cardCanScroll) event.preventDefault();
  }, { passive: false });

  zoom(backdrop, { opacity: 0 }, { opacity: 1 });
  zoom(visual, { height: cardVisualHeight }, { height: visualHeight });
  zoom(summary, { opacity: 1 }, { opacity: 0 }, { duration: 180 });
  zoom(body, { opacity: 0 }, { opacity: 1 }, { delay: 180, duration: 320 });
  zoom(modal, { ...toFrame(from), borderRadius: '10px' }, { ...toFrame(to), borderRadius: '16px' }).finished.then(() => {
    modal.classList.remove('is-animating');
    ['left', 'top', 'width', 'height'].forEach(prop => modal.style.removeProperty(prop));
    visual.style.removeProperty('height');
    body.style.removeProperty('width');
  }, () => {});
  modal.focus({ preventScroll: true });
}

async function closeProject() {
  if (!projectView || projectView.closing) return;
  projectView.closing = true;
  const { overlay, modal, inner, visual, summary, body, backdrop, card } = projectView;

  // Start from wherever everything is right now, so closing mid-open doesn't jump.
  const from = { ...toFrame(modal.getBoundingClientRect()), borderRadius: getComputedStyle(modal).borderRadius };
  const [backdropOpacity, summaryOpacity, bodyOpacity] = [backdrop, summary, body].map(el => getComputedStyle(el).opacity);
  const visualHeight = `${visual.offsetHeight}px`;
  const bodyWidth = `${body.offsetWidth}px`;
  const scrolled = modal.scrollTop;
  overlay.getAnimations({ subtree: true }).forEach(a => a.cancel());

  // Swap the card's scroll position for a transform so it can animate back to the top.
  modal.classList.add('is-animating');
  modal.scrollTop = 0;
  body.style.width = bodyWidth;
  summary.style.width = `${card.clientWidth}px`;

  zoom(backdrop, { opacity: backdropOpacity }, { opacity: 0 });
  zoom(inner, { transform: `translateY(${-scrolled}px)` }, { transform: 'none' });
  zoom(visual, { height: visualHeight }, { height: `${card.querySelector('.project-visual').offsetHeight}px` });
  zoom(body, { opacity: bodyOpacity }, { opacity: 0 }, { duration: 180 });
  zoom(summary, { opacity: summaryOpacity }, { opacity: 1 }, { delay: 200, duration: 250 });
  await zoom(modal, from, { ...toFrame(card.getBoundingClientRect()), borderRadius: '10px' }).finished;

  card.classList.remove('is-expanded');
  overlay.remove();
  projectView = null;
  card.focus({ preventScroll: true });
}

document.querySelectorAll('.project-card').forEach(card => {
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-haspopup', 'dialog');
  card.addEventListener('click', () => openProject(card));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openProject(card);
    }
  });
});

const saveDrive = document.getElementById('saveDrive');
const driveInput = document.getElementById('driveInput');
const driveLink = document.getElementById('driveLink');

saveDrive?.addEventListener('click', () => {
  const url = driveInput.value.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    driveInput.focus();
    driveInput.setCustomValidity('Please paste a valid Google Drive URL.');
    driveInput.reportValidity();
    return;
  }
  driveInput.setCustomValidity('');
  driveLink.href = url;
  driveLink.hidden = false;
  saveDrive.textContent = 'Drive Link Saved ✓';
  setTimeout(() => saveDrive.textContent = 'Save Drive Link →', 1600);
});
