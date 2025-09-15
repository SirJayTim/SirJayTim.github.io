// Theme toggle with localStorage persistence
(function () {
    const root = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('theme');
    if (saved) root.setAttribute('data-theme', saved);
    toggle && toggle.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? '' : 'light';
        if (next) root.setAttribute('data-theme', next); else root.removeAttribute('data-theme');
        if (next) localStorage.setItem('theme', next); else localStorage.removeItem('theme');
    });
})();

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
(function () {
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
    }));
})();

// Smooth scroll offset fix for sticky header
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        const y = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: 'smooth' });
    });
});

// Load projects and gallery from JSON
async function loadData() {
    try {
        const res = await fetch('data/projects.json', { cache: 'no-store' });
        const data = await res.json();
        renderProjects(data.caseStudies || []);
        renderGallery(data.gallery || []);
    } catch (err) {
        console.error('Failed to load data', err);
    }
}

function renderProjects(items) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach((p, idx) => {
        const card = document.createElement('article');
        card.className = 'project-card' + (idx % 3 === 0 ? ' large' : '');
        card.innerHTML = `
      <a href="${p.link || '#'}" target="_blank" rel="noopener" class="project-media" style="background:url('${p.cover || ''}') center/cover no-repeat"></a>
      <div class="project-body">
        <div class="cluster" style="justify-content: space-between;">
          <h3 style="margin:0">${p.title}</h3>
          <span class="muted">${p.year || ''}</span>
        </div>
        <p class="muted">${p.subtitle || ''}</p>
        <div class="tags">${(p.tags || []).map(t => `<span class='tag'>${t}</span>`).join('')}</div>
      </div>`;
        grid.appendChild(card);
    });
}

function renderGallery(items) {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(g => {
        const item = document.createElement('figure');
        item.className = 'masonry-item';
        item.dataset.category = g.category || 'misc';
        item.innerHTML = `
      <img src="${g.src}" alt="${g.alt || ''}" loading="lazy" />
      <figcaption class="caption">${g.caption || ''}</figcaption>`;
        item.querySelector('img').addEventListener('click', () => openLightbox(g.src, g.caption || g.alt || ''));
        grid.appendChild(item);
    });

    // filtering
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        const filter = chip.getAttribute('data-filter');
        grid.querySelectorAll('.masonry-item').forEach(el => {
            el.style.display = (filter === 'all' || el.dataset.category === filter) ? '' : 'none';
        });
    }));
}

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.querySelector('.lightbox-image');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
function openLightbox(src, caption) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('show');
    lightbox.setAttribute('aria-hidden', 'false');
}
function closeLightbox() {
    lightbox.classList.remove('show');
    lightbox.setAttribute('aria-hidden', 'true');
}
lightboxClose && lightboxClose.addEventListener('click', closeLightbox);
lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// Reveal on scroll (optional nicety)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in');
    });
}, { threshold: 0.08 });
document.querySelectorAll('.project-card, .masonry-item, .card, .hero-title').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
});

// minimal reveal styles injected
const style = document.createElement('style');
style.textContent = `.reveal{opacity:.001;transform:translateY(12px)}.reveal.in{opacity:1;transform:none;transition:opacity .5s ease, transform .5s ease}`;
document.head.appendChild(style);

// 3D hero using Three.js — subtle interactive shape to keep perf high
function initHero3D() {
    const container = document.getElementById('hero-canvas');
    if (!container || !window.THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 3.2;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(2, 2, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Textured Earth with clouds
    const earthGroup = new THREE.Group();
    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load('https://raw.githubusercontent.com/rajdeepbharati/threejs-earth-assets/main/earth-day.jpg');
    const earthBump = loader.load('https://raw.githubusercontent.com/rajdeepbharati/threejs-earth-assets/main/earth-bump.jpg');
    const earthSpec = loader.load('https://raw.githubusercontent.com/rajdeepbharati/threejs-earth-assets/main/earth-spec.jpg');
    const cloudTexture = loader.load('https://raw.githubusercontent.com/rajdeepbharati/threejs-earth-assets/main/earth-clouds.png');

    const earthMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 64, 64),
        new THREE.MeshPhongMaterial({ map: earthTexture, bumpMap: earthBump, bumpScale: 0.03, specularMap: earthSpec, specular: new THREE.Color('grey'), shininess: 8 })
    );
    earthGroup.add(earthMesh);

    const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.12, 64, 64),
        new THREE.MeshLambertMaterial({ map: cloudTexture, transparent: true, opacity: 0.4 })
    );
    earthGroup.add(clouds);

    scene.add(earthGroup);

    let mouseX = 0, mouseY = 0;
    container.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * Math.PI * 0.1;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * Math.PI * 0.1;
    });

    // Drag to rotate
    let isDragging = false, lastX = 0, lastY = 0;
    container.addEventListener('pointerdown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; container.setPointerCapture(e.pointerId); });
    container.addEventListener('pointerup',   (e) => { isDragging = false; container.releasePointerCapture(e.pointerId); });
    container.addEventListener('pointerleave',() => { isDragging = false; });
    container.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        earthGroup.rotation.y += dx * 0.005;
        earthGroup.rotation.x += dy * 0.005;
        lastX = e.clientX; lastY = e.clientY;
    });

    function onResize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    function animate() {
        requestAnimationFrame(animate);
        earthGroup.rotation.x += 0.002 + (mouseY - earthGroup.rotation.x) * 0.02;
        earthGroup.rotation.y += 0.003 + (mouseX - earthGroup.rotation.y) * 0.02;
        clouds.rotation.y += 0.0008;
        renderer.render(scene, camera);
    }
    animate();
}

loadData();
window.addEventListener('load', initHero3D);


