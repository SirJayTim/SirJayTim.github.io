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

// 3D hero using Three.js — interactive black hole scene
function initHero3D() {
    const container = document.getElementById('hero-canvas');
    if (!container || !window.THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.z = 3.2;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Utility: generate a soft radial gradient texture on the fly
    function makeRadialTexture(innerColor, outerColor) {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, innerColor);
        grad.addColorStop(1, outerColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.Texture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // Black hole group
    const holeGroup = new THREE.Group();

    // Event horizon (pure black, no lighting required)
    const horizon = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    holeGroup.add(horizon);

    // Accretion disk using a glowing ring
    const diskTexture = makeRadialTexture('rgba(255, 180, 80, 0.9)', 'rgba(255, 120, 40, 0.0)');
    const disk = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.9, 128),
        new THREE.MeshBasicMaterial({ map: diskTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    disk.rotation.x = Math.PI / 2.2;
    holeGroup.add(disk);

    // Relativistic glow halo as a sprite
    const haloTexture = makeRadialTexture('rgba(255, 200, 120, 0.25)', 'rgba(0,0,0,0)');
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(4.2, 4.2, 1);
    holeGroup.add(halo);

    // Starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const radius = 20 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, sizeAttenuation: true }));
    scene.add(stars);

    scene.add(holeGroup);

    let mouseX = 0, mouseY = 0;
    container.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * Math.PI * 0.1;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * Math.PI * 0.1;
    });

    // Drag to rotate
    let isDragging = false, lastX = 0, lastY = 0;
    container.addEventListener('pointerdown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; container.setPointerCapture(e.pointerId); });
    container.addEventListener('pointerup', (e) => { isDragging = false; container.releasePointerCapture(e.pointerId); });
    container.addEventListener('pointerleave', () => { isDragging = false; });
    container.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        holeGroup.rotation.y += dx * 0.005;
        holeGroup.rotation.x += dy * 0.005;
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
        holeGroup.rotation.x += 0.0015 + (mouseY - holeGroup.rotation.x) * 0.02;
        holeGroup.rotation.y += 0.0025 + (mouseX - holeGroup.rotation.y) * 0.02;
        disk.rotation.z += 0.004; // disk spin
        stars.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }
    animate();
}

loadData();
window.addEventListener('load', initHero3D);


