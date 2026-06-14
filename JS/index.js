
/* ═══════════════════════════════════════
   PAGE NAVIGATION
═══════════════════════════════════════ */
function transition(e, url) {
    e.preventDefault();
    const o = document.getElementById('overlay');
    o.classList.add('active');
    setTimeout(() => { window.location.href = url; }, 380);
}

/* Category pills */
document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', function () {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active', 'blur'));
        this.classList.add('active');
        const pills = [...document.querySelectorAll('.cat-pill')];
        const idx = pills.indexOf(this);
        if (idx > 0) pills[idx - 1].classList.add('blur');
        if (idx < pills.length - 1) pills[idx + 1].classList.add('blur');
    });
});

/* ═══════════════════════════════════════
   DATA + ELEMENTS
═══════════════════════════════════════ */
const ASSET = id => {
    if (id === 'bowl_of_nuts') return 'Images/bowl_of_nuts.png';
    if (id && (id.startsWith('http') || id.startsWith('Images/'))) return id;
    return `https://www.figma.com/api/mcp/asset/${id}`;
};

let DISHES = [];

const VEG_SVG = `<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="#2e7d32" stroke-width="1.3"/><circle cx="8" cy="8" r="4" fill="#2e7d32"/></svg><span>Veg</span>`;
const NON_SVG = `<svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="#d32f2f" stroke-width="1.3"/><circle cx="8" cy="8" r="4" fill="#d32f2f"/></svg><span>Non</span>`;

const card = document.getElementById('ovCard');
const backdrop = document.getElementById('ovBackdrop');
const stage = document.getElementById('ovImageStage');
const body = document.getElementById('ovBody');
const carousel = document.getElementById('ovCarousel');
const track = document.getElementById('ovCarouselTrack');
const closeBtn = document.getElementById('ovCloseBtn');
const addBtn = document.getElementById('ovAddBtn');
const pullHint = document.getElementById('ovPullHint');

const IMG_EXPANDED_H = 340;
let currentPreviewStageH = 191;

let currentIndex = 0;
let cardState = 'closed';  // closed | preview | expanded
let progress = 0;
let cartCount = 0;
let isSliding = false;

function getStagePreviewHeight() {
    const vh = window.innerHeight;
    const top = 16;
    const cardHeight = Math.min(vh - 132, 666);

    const topbar = document.querySelector('.ov-topbar');
    const tabs = document.querySelector('.ov-tabs');
    const body = document.querySelector('.ov-body');

    const topbarH = topbar ? topbar.offsetHeight : 52;
    const tabsH = tabs ? tabs.offsetHeight : 49;

    let bodyContentH = 200;
    if (body) {
        let contentH = 0;
        let visibleCount = 0;
        const children = [...body.children];
        for (const child of children) {
            if (child.id === 'ovImageStage') {
                continue;
            }
            // Exclude expanded-only elements and spacer
            if (child.classList.contains('ov-extra') || child.offsetHeight === 0) {
                continue;
            }
            if (child.style.height === '32px' || child.style.height === '24px' || (child.tagName === 'DIV' && !child.className && !child.id)) {
                continue;
            }
            if (child.id === 'ovCube' && child.style.display === 'none') {
                continue;
            }
            contentH += child.offsetHeight || child.getBoundingClientRect().height;
            visibleCount++;
        }
        const gapCount = visibleCount;
        bodyContentH = contentH + (gapCount * 18) + 32; // elements + gaps + padding (16px top + 16px bottom)
    }

    const stageH = cardHeight - topbarH - tabsH - bodyContentH;
    return Math.max(120, stageH);
}

function updatePreviewStageHeight() {
    const target = getPreviewRect();
    const originalWidth = card.style.width;

    // Temporarily set the card width to the target preview width to ensure correct text wrapping layout
    card.style.width = target.width + 'px';

    // Force a reflow
    card.offsetHeight;

    // Measure the stage height
    currentPreviewStageH = getStagePreviewHeight();

    // Restore the original card width
    card.style.width = originalWidth;
}

/* ═══════════════════════════════════════
   GEOMETRY
═══════════════════════════════════════ */
function getPreviewRect() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const width = vw <= 480 ? vw - 32 : 362;
    const top = 16;
    const height = Math.min(vh - 132, 666);
    const left = (vw - width) / 2;
    return { left, top, width, height, radius: 18 };
}
function getExpandedRect() {
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, radius: 0 };
}

/* ═══════════════════════════════════════
   RENDER CONTENT
═══════════════════════════════════════ */
/* Direction: 'right' = next (slides in from right), 'left' = prev (slides in from left), null = no anim */
function getSlideDirection(from, to, n) {
    if (from === to || n === 0) return null;
    const fwd = ((to - from) % n + n) % n;   // steps going forward
    const bwd = ((from - to) % n + n) % n;   // steps going backward
    return fwd <= bwd ? 'right' : 'left';
}

function renderDish(idx, animateImg, direction) {
    const d = DISHES[idx];
    const sharp = document.getElementById('ovImgSharp');
    const blur = document.getElementById('ovImgBlur');
    const modelViewer = document.getElementById('ovModelViewer');
    const cube = document.getElementById('ovCube');

    if (d.glb) {
        sharp.style.display = 'none';
        blur.style.display = 'none';
        modelViewer.style.display = 'block';
        modelViewer.src = d.glb;
        stage.classList.add('has-3d');
    } else {
        sharp.style.display = 'block';
        blur.style.display = 'none';
        modelViewer.style.display = 'none';
        stage.classList.remove('has-3d');

        const url = ASSET(d.img);
        if (animateImg && direction) {
            const startX = direction === 'right' ? '30px' : '-30px';
            sharp.style.transition = 'none';
            sharp.style.transform = `translateX(${startX})`;
            sharp.style.opacity = '0';
            requestAnimationFrame(() => {
                sharp.src = url; blur.src = url;
                requestAnimationFrame(() => {
                    sharp.style.transition = 'opacity 0.22s ease, transform 0.26s cubic-bezier(.22,.61,.36,1)';
                    sharp.style.transform = 'translateX(0)';
                    sharp.style.opacity = '1';
                });
            });
        } else if (animateImg) {
            sharp.style.opacity = '0';
            setTimeout(() => {
                sharp.src = url; blur.src = url;
                sharp.style.opacity = '1';
            }, 140);
        } else {
            sharp.src = url; blur.src = url;
        }
    }

    document.getElementById('ovTitle').textContent = d.name;
    document.getElementById('ovDesc').textContent = d.desc;
    document.getElementById('ovPrice').textContent = '₹' + d.price;
    document.getElementById('ovTime').textContent = d.time;

    const vegBadge = document.getElementById('ovVegBadge');
    vegBadge.innerHTML = d.veg ? VEG_SVG : NON_SVG;
    vegBadge.className = 'veg-badge' + (d.veg ? '' : ' non-badge');

    /* Slide text content in the appropriate direction */
    if (direction) {
        const animClass = direction === 'right' ? 'slide-in-right' : 'slide-in-left';
        const textEls = [
            document.getElementById('ovCube'),
            document.getElementById('ovTitle'),
            document.getElementById('ovDesc'),
            document.querySelector('.ov-tags'),
            document.querySelector('.ov-price-row'),
        ].filter(Boolean);
        textEls.forEach(el => {
            el.classList.remove('slide-in-right', 'slide-in-left');
            void el.offsetWidth; // force reflow to restart animation
            el.classList.add(animClass);
        });
    }

    renderMoreDishes(idx);
}

function renderMoreDishes(idx) {
    const grid = document.getElementById('ovMoreGrid');
    grid.innerHTML = '';
    const n = DISHES.length;
    const others = [1, 2, 3, 4].map(i => (idx + i) % n);

    for (let r = 0; r < 2; r++) {
        const row = document.createElement('div');
        row.className = 'ov-more-row';
        for (let c = 0; c < 2; c++) {
            const dIdx = others[r * 2 + c];
            const d = DISHES[dIdx];
            const el = document.createElement('div');
            el.className = 'ov-more-card';
            el.onclick = () => switchDish(dIdx, true);
            el.innerHTML = `
        <div class="ov-more-img"><img src="${ASSET(d.img)}" alt="${d.name}"/></div>
        <div class="ov-more-meta">
          <div class="ov-more-name">${d.name}</div>
          <div class="ov-more-tags">
            <div class="veg-badge${d.veg ? '' : ' non-badge'}">${d.veg ? VEG_SVG : NON_SVG}</div>
            <div class="divider-dot"></div>
            <span class="ov-time">${d.time}</span>
          </div>
          <div class="ov-more-price">₹${d.price}</div>
        </div>`;
            row.appendChild(el);
        }
        grid.appendChild(row);
    }
}

/* ═══════════════════════════════════════
   CAROUSEL — 5 thumbnails, swipe + tap
═══════════════════════════════════════ */
function renderCarousel() {
    track.innerHTML = '';
    const n = DISHES.length;
    const LAYOUT = [
        { off: -2, size: 'size-sm' },
        { off: -1, size: 'size-md' },
        { off: 0, size: 'size-lg' },
        { off: 1, size: 'size-md' },
        { off: 2, size: 'size-sm' },
    ];
    LAYOUT.forEach(item => {
        const idx = ((currentIndex + item.off) % n + n) % n;
        const thumb = document.createElement('div');
        thumb.className = 'ov-thumb ' + item.size;
        thumb.dataset.idx = idx;
        thumb.innerHTML = `<img src="${ASSET(DISHES[idx].img)}" alt="${DISHES[idx].name}" draggable="false"/>`;
        thumb.addEventListener('click', () => switchDish(idx, false));
        track.appendChild(thumb);
    });
}

/* Swipe-carousel */
let carSwipeStartX = 0, carSwiping = false, carSwipeThreshold = 42;

track.addEventListener('touchstart', e => {
    carSwipeStartX = e.touches[0].clientX;
    carSwiping = true;
}, { passive: true });
track.addEventListener('touchend', e => {
    if (!carSwiping) return;
    carSwiping = false;
    const dx = e.changedTouches[0].clientX - carSwipeStartX;
    if (Math.abs(dx) < carSwipeThreshold) return;
    const n = DISHES.length;
    const next = dx < 0
        ? (currentIndex + 1) % n
        : (currentIndex - 1 + n) % n;
    switchDish(next, false);
}, { passive: true });

function switchDish(idx, forceExpanded) {
    if ((idx === currentIndex && !forceExpanded) || isSliding) return;

    const direction = getSlideDirection(currentIndex, idx, DISHES.length);
    currentIndex = idx;

    if (direction && cardState !== 'closed') {
        isSliding = true;
        const EXIT_MS  = 160;
        const ENTER_MS = 200;
        const n = DISHES.length;

        const bodyExitX  = direction === 'right' ? '-105%' : '105%';
        const bodyEnterX = direction === 'right' ?  '105%' : '-105%';

        // Measure how far to slide the track so the target thumb reaches visual center
        const thumbEls = [...track.querySelectorAll('.ov-thumb')];
        let carSlideX = 0;
        if (thumbEls.length === 5) {
            const cRect = thumbEls[2].getBoundingClientRect(); // current center (lg)
            const tRect = (direction === 'right' ? thumbEls[3] : thumbEls[1]).getBoundingClientRect();
            carSlideX = -((tRect.left + tRect.width / 2) - (cRect.left + cRect.width / 2));
        }

        // ── EXIT: body slides out, carousel track slides in same direction ──
        body.style.transition = `transform ${EXIT_MS}ms cubic-bezier(.4,0,.2,1)`;
        body.style.transform  = `translateX(${bodyExitX})`;

        if (carSlideX !== 0) {
            track.style.transition = `transform ${EXIT_MS}ms cubic-bezier(.4,0,.2,1)`;
            track.style.transform  = `translateX(${carSlideX}px)`;
        }

        setTimeout(() => {
            // ── UPDATE content while body is off-screen ──
            renderDish(idx, false, null);

            // Update carousel thumbs in-place (size classes stay [sm,md,lg,md,sm])
            // Just update src + click handlers, then snap track to 0
            const LAYOUT = [
                { off: -2, size: 'size-sm' },
                { off: -1, size: 'size-md' },
                { off:  0, size: 'size-lg' },
                { off:  1, size: 'size-md' },
                { off:  2, size: 'size-sm' },
            ];
            const freshThumbs = [...track.querySelectorAll('.ov-thumb')];
            LAYOUT.forEach((item, i) => {
                const dIdx = ((currentIndex + item.off) % n + n) % n;
                const thumb = freshThumbs[i];
                const img   = thumb.querySelector('img');
                img.src      = ASSET(DISHES[dIdx].img);
                img.alt      = DISHES[dIdx].name;
                thumb.dataset.idx = dIdx;
                thumb.onclick     = () => switchDish(dIdx, false);
            });
            // Snap track back to zero (no animation needed – body is off-screen)
            track.style.transition = 'none';
            track.style.transform  = '';

            updatePreviewStageHeight();
            stage.style.height = currentPreviewStageH + 'px';

            // Snap body to enter side
            body.style.transition = 'none';
            body.style.transform  = `translateX(${bodyEnterX})`;
            void body.offsetHeight;

            // ── ENTER: body slides in ──
            body.style.transition = `transform ${ENTER_MS}ms cubic-bezier(.22,.61,.36,1)`;
            body.style.transform  = 'translateX(0)';

            setTimeout(() => {
                body.style.transition = '';
                body.style.transform  = '';
                track.style.transition = '';
                isSliding = false;
                if (forceExpanded && cardState !== 'expanded') snapTo('expanded');
            }, ENTER_MS);
        }, EXIT_MS);

    } else {
        renderDish(idx, true, null);
        renderCarousel();
        updatePreviewStageHeight();
        stage.style.height = currentPreviewStageH + 'px';
        if (forceExpanded && cardState !== 'expanded') snapTo('expanded');
    }
}

/* ═══════════════════════════════════════
   OPEN — FLIP from grid card → preview
═══════════════════════════════════════ */
function openPreview(e, cardEl, idx) {
    e.preventDefault();
    if (cardState !== 'closed') return;
    currentIndex = idx;
    renderDish(idx, false);
    renderCarousel();

    const imgEl = cardEl.querySelector('.dish-img');
    const r = imgEl.getBoundingClientRect();

    document.body.classList.add('ov-lock');

    /* Instant-place the card at the tapped image position */
    card.classList.remove('animate', 'is-expanded');
    card.classList.add('visible');
    card.style.left = r.left + 'px';
    card.style.top = r.top + 'px';
    card.style.width = r.width + 'px';
    card.style.height = r.height + 'px';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 4px 16px rgba(0,0,0,.18)';
    stage.style.height = r.height + 'px';

    // Calculate the dynamic stage height for this dish
    updatePreviewStageHeight();

    /* Hide card internals until card grows */
    body.style.opacity = '0';
    document.getElementById('ovTabs').style.opacity = '0';
    backdrop.classList.remove('show');

    /* Double-rAF ensures browser paints initial position first */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.classList.add('animate');
            const target = getPreviewRect();
            card.style.left = target.left + 'px';
            card.style.top = target.top + 'px';
            card.style.width = target.width + 'px';
            card.style.height = target.height + 'px';
            card.style.borderRadius = target.radius + 'px';
            card.style.boxShadow = '0 32px 80px rgba(0,0,0,.38)';
            stage.style.height = currentPreviewStageH + 'px';

            backdrop.classList.add('show');
            carousel.classList.add('show');

            body.style.transition = 'opacity .22s ease .15s';
            document.getElementById('ovTabs').style.transition = 'opacity .22s ease .15s';
            body.style.opacity = '1';
            document.getElementById('ovTabs').style.opacity = '1';

            cardState = 'preview';
            progress = 0;
        });
    });
}

/* ═══════════════════════════════════════
   CLOSE — FLIP back to grid card
═══════════════════════════════════════ */
function closePreview() {
    if (cardState === 'closed') return;

    const targetCardEl = document.querySelector(`.dish-card[data-idx="${currentIndex}"]`);
    const imgEl = targetCardEl ? targetCardEl.querySelector('.dish-img') : null;
    if (!imgEl) { hardClose(); return; }
    const r = imgEl.getBoundingClientRect();

    card.classList.add('animate');
    card.classList.remove('is-expanded');

    /* Collapse content immediately */
    body.style.transition = 'opacity .18s ease';
    body.style.opacity = '0';
    document.getElementById('ovTabs').style.transition = 'opacity .18s ease';
    document.getElementById('ovTabs').style.opacity = '0';
    backdrop.classList.remove('show');
    carousel.classList.remove('show');

    /* Animate card back to its origin */
    card.style.left = r.left + 'px';
    card.style.top = r.top + 'px';
    card.style.width = r.width + 'px';
    card.style.height = r.height + 'px';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 4px 8px rgba(0,0,0,.12)';
    stage.style.height = r.height + 'px';

    document.body.classList.remove('ov-lock');

    setTimeout(() => { hardClose(); }, 340);
}

function hardClose() {
    card.classList.remove('visible', 'animate', 'is-expanded', 'is-fully-expanded');
    body.style.overflowY = 'hidden';
    body.style.opacity = '';
    body.style.transition = '';
    body.scrollTop = 0;
    pullHint.style.opacity = '0';
    cardState = 'closed';
    progress = 0;
    const modelViewer = document.getElementById('ovModelViewer');
    if (modelViewer) modelViewer.src = '';
}

closeBtn.addEventListener('click', closePreview);
backdrop.addEventListener('click', () => { if (cardState === 'preview') closePreview(); });

/* ═══════════════════════════════════════
   QUANTITIES
═══════════════════════════════════════ */
document.getElementById('ovQuantities').addEventListener('click', e => {
    const opt = e.target.closest('.ov-qty-opt');
    if (!opt) return;
    document.querySelectorAll('.ov-qty-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
});

/* ═══════════════════════════════════════
   ADD TO ORDER
═══════════════════════════════════════ */
addBtn.addEventListener('click', () => {
    cartCount++;
    document.getElementById('ovCartCount').textContent = cartCount;
    document.querySelectorAll('.cart-btn').forEach(b => {
        const t = b.childNodes[b.childNodes.length - 1];
        if (t.nodeType === 3) t.textContent = ' ' + cartCount;
    });
    const prev = addBtn.innerHTML;
    addBtn.style.background = '#2e7d32';
    addBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Added`;
    setTimeout(() => { addBtn.style.background = '#000'; addBtn.innerHTML = prev; }, 1400);
});

/* ═══════════════════════════════════════
   SCROLL-DRIVEN EXPAND / COLLAPSE
   ─ preview: drag up in body → expand
   ─ expanded: scroll at top + drag down → collapse
═══════════════════════════════════════ */

function applyProgress(t) {
    progress = Math.max(0, Math.min(1, t));
    const pr = getPreviewRect();
    const er = getExpandedRect();

    const left = pr.left + (er.left - pr.left) * progress;
    const top = pr.top + (er.top - pr.top) * progress;
    const width = pr.width + (er.width - pr.width) * progress;
    const height = pr.height + (er.height - pr.height) * progress;
    const radius = pr.radius * (1 - progress);

    card.style.left = left + 'px';
    card.style.top = top + 'px';
    card.style.width = width + 'px';
    card.style.height = height + 'px';
    card.style.borderRadius = radius + 'px';

    stage.style.height = currentPreviewStageH + 'px';

    // Fade tabs and carousel out as we expand
    const tabsEl = document.getElementById('ovTabs');
    const tabsOpacity = Math.max(0, 1 - progress * 2.5);
    if (tabsEl) {
        tabsEl.style.opacity = tabsOpacity;
        tabsEl.style.maxHeight = (56 * (1 - progress)) + 'px';
    }

    const bgOpacity = 0.52 * (1 - progress);
    const blurPx = 8 * (1 - progress);
    backdrop.style.background = `rgba(0,0,0,${bgOpacity})`;
    backdrop.style.backdropFilter = `blur(${blurPx}px)`;
    backdrop.style.webkitBackdropFilter = `blur(${blurPx}px)`;

    carousel.style.opacity = '' + (1 - progress);
    carousel.style.transform = `translateY(${18 * progress}px)`;

    if (progress > 0.5) card.classList.add('is-expanded');
    else card.classList.remove('is-expanded');
}

function snapTo(state) {
    card.classList.add('animate');
    cardState = state;
    const tabsEl = document.getElementById('ovTabs');

    if (state === 'expanded') {
        const er = getExpandedRect();
        card.style.left = '0px';
        card.style.top = '0px';
        card.style.width = er.width + 'px';
        card.style.height = er.height + 'px';
        card.style.borderRadius = '0px';
        stage.style.height = currentPreviewStageH + 'px';
        backdrop.style.background = 'rgba(0,0,0,0)';
        backdrop.style.backdropFilter = 'blur(0px)';
        backdrop.style.webkitBackdropFilter = 'blur(0px)';
        backdrop.classList.remove('show');
        carousel.classList.remove('show');
        card.classList.add('is-expanded');
        card.classList.add('is-fully-expanded');
        // Let CSS class handle tabs collapse (clear inline so CSS kicks in)
        if (tabsEl) { tabsEl.style.opacity = ''; tabsEl.style.maxHeight = ''; }
        body.style.overflowY = 'auto';
        progress = 1;
    } else {
        const pr = getPreviewRect();
        card.style.left = pr.left + 'px';
        card.style.top = pr.top + 'px';
        card.style.width = pr.width + 'px';
        card.style.height = pr.height + 'px';
        card.style.borderRadius = pr.radius + 'px';
        stage.style.height = currentPreviewStageH + 'px';
        backdrop.style.background = '';
        backdrop.style.backdropFilter = '';
        backdrop.style.webkitBackdropFilter = '';
        backdrop.classList.add('show');
        carousel.classList.add('show');
        card.classList.remove('is-expanded');
        card.classList.remove('is-fully-expanded');
        // Clear inline so CSS class restores tabs
        if (tabsEl) { tabsEl.style.opacity = ''; tabsEl.style.maxHeight = ''; }
        body.style.overflowY = 'hidden';
        body.scrollTop = 0;
        pullHint.style.opacity = '0';
        progress = 0;
    }
    card.classList.add('animate');
}

/* Pointer tracking — only body content, not image or carousel */
let dragging = false, startY = 0;
const EXPAND_DISTANCE = 100; // px to fully expand/collapse
const PULL_THRESHOLD = 70;  // px past top to show hint

body.addEventListener('touchstart', onDragStart, { passive: true });
body.addEventListener('touchmove', onDragMove, { passive: false });
body.addEventListener('touchend', onDragEnd, { passive: true });
body.addEventListener('mousedown', onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup', onDragEnd);

function getY(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
    return e.clientY;
}

function onDragStart(e) {
    if (cardState === 'closed') return;
    /* Ignore drags on interactive items and the image stage */
    if (e.target.closest('.ov-add-btn,.ov-qty-opt,.ov-more-card,.ov-section-arrow,.ov-thumb,.ov-carousel-track,.ov-image-stage')) return;
    /* In expanded state, only start drag when at top of scroll */
    if (cardState === 'expanded' && body.scrollTop > 0) return;

    dragging = true;
    startY = getY(e);
    card.classList.remove('animate');
}

function onDragMove(e) {
    if (!dragging) return;
    const y = getY(e);
    const deltaY = startY - y; // positive = finger moved up

    if (cardState === 'preview') {
        if (deltaY <= 0) return; // only expand upward
        e.preventDefault();
        applyProgress(deltaY / EXPAND_DISTANCE);
    } else if (cardState === 'expanded') {
        if (body.scrollTop > 0) return;
        if (deltaY >= 0) return; // only collapse downward
        e.preventDefault();
        const collapseProgress = 1 + deltaY / EXPAND_DISTANCE;
        applyProgress(collapseProgress);
        /* Show pull hint */
        const pullRatio = Math.min(1, -deltaY / PULL_THRESHOLD);
        pullHint.style.opacity = '' + pullRatio;
    }
}

function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    pullHint.style.opacity = '0';

    if (progress <= 0 || progress >= 1) {
        if (progress <= 0) snapTo('preview');
        else snapTo('expanded');
        return;
    }
    if (progress > 0.38) snapTo('expanded');
    else snapTo('preview');
}

function renderGridDynamically() {
    const grid = document.getElementById('dishGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < DISHES.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'dish-row';

        for (let j = 0; j < 2; j++) {
            const idx = i + j;
            if (idx >= DISHES.length) break;
            const d = DISHES[idx];
            const isVeg = d.veg;
            const badgeSVG = isVeg ? VEG_SVG : NON_SVG;

            const cardEl = document.createElement('div');
            cardEl.className = 'dish-card';
            cardEl.dataset.idx = idx;
            cardEl.onclick = (e) => openPreview(e, cardEl, idx);

            cardEl.innerHTML = `
            <div class="dish-img"><img src="${ASSET(d.img)}" alt="${d.name}"/></div>
            <div class="dish-meta">
              <div class="dish-name">${d.name}</div>
              <div class="dish-tags">
                <div class="veg-badge ${isVeg ? '' : 'non-badge'}">${badgeSVG}</div>
                <div class="divider-dot"></div>
                <span class="dish-time">${d.time}</span>
              </div>
              <div class="dish-price">₹${d.price}</div>
            </div>
          `;
            row.appendChild(cardEl);
        }
        grid.appendChild(row);
    }
}

async function loadStartersFromSupabase() {
    if (typeof supabaseClient === 'undefined') return;
    try {
        const { data, error } = await supabaseClient.from('dishes').select('*').eq('main_category_id', 1);
        if (data && data.length > 0) {
            DISHES = data.map(d => ({
                name: d.name,
                veg: d.is_veg,
                time: d.prep_time || '20-25 mins',
                price: d.price,
                glb: d.model_url || d.model_3d_url || null,
                img: d.image_url || d.img_url || 'Images/default.png',
                desc: d.description || ''
            }));
            renderGridDynamically();
        }
    } catch (e) {
        console.error("Error loading starters from Supabase:", e);
    }
}

// Initialize layout
renderGridDynamically();
loadStartersFromSupabase();