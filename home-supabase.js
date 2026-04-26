// home-supabase.js

document.addEventListener('DOMContentLoaded', () => {
    fetchHomepageData();

    // Bottom Sheet Nested Scroll Handoff
    const screen = document.querySelector('.screen');
    const container = document.querySelector('.content-card-container');

    if (screen && container) {
        // Initially lock internal scroll so drags propagate to .screen
        container.style.overflowY = 'visible';

        screen.addEventListener('scroll', () => {
            const heroElem = document.querySelector('.hero');
            const searchSection = document.querySelector('.search-section');
            // Maximum scroll distance of .screen is exactly 326px 
            // We unlock the inner scroll container right as it hits the top!
            if (screen.scrollTop >= 325) {
                container.style.overflowY = 'auto';
                container.classList.add('scrolled-top');
                if (heroElem) heroElem.classList.add('scrolled-top');
                if (searchSection) searchSection.classList.add('hidden');
            } else {
                container.style.overflowY = 'visible';
                container.classList.remove('scrolled-top');
                if (heroElem) heroElem.classList.remove('scrolled-top');
                if (searchSection) searchSection.classList.remove('hidden');
            }
        });

        container.addEventListener('scroll', () => {
            // If user scrolls back down to the very top of the card's inner content,
            // we lock it again so their next swipe down drags the card down physically!
            if (container.scrollTop <= 1) {
                container.style.overflowY = 'visible';
            }
        });
    }
});

async function fetchHomepageData() {
    if (!window.supabase) {
        alert('Supabase client failed to load! Check network or CDN.');
        console.error('Supabase client missing!');
        return;
    }

    const { data: spotlightData, error: err1 } = await supabaseClient.from('spotlight_dishes').select('*');
    if (err1) {
        alert("Failed to fetch Spotlight: " + err1.message);
        console.error("Spotlight Error:", err1);
    }
    else if (spotlightData && spotlightData.length > 0) {
        renderSpotlight(spotlightData);
    }
    else if (spotlightData && spotlightData.length === 0) {
        alert("Supabase connected successfully, but returned 0 rows! Please check your Row Level Security (RLS) policies on the 'spotlight_dishes' table to allow public reads.");
    }

    // 2. Categories ("What would you like to have today?")
    const { data: categories, error: err2 } = await supabaseClient.from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
    if (err2) console.error("Categories Error:", err2);
    else if (categories && categories.length > 0) renderCategories(categories);

    // 3. Most Ordered (Dynamically fetching items from the 'special_most_ordered' table)
    const { data: mostOrdered, error: err3 } = await supabaseClient.from('special_most_ordered')
        .select('*');

    if (err3) console.error("Most Ordered Error:", err3);
    else if (mostOrdered && mostOrdered.length > 0) renderMostOrdered(mostOrdered);

    // 4. Popular Categories
    const { data: popCategories, error: err4 } = await supabaseClient.from('popular_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (err4) console.error("Pop Categories Error:", err4);
    else if (popCategories && popCategories.length > 0) renderPopularCategories(popCategories);

    // 5. Recent Highlights - Temporarily disabled to prevent 404 errors 
    // Uncomment this once you create a 'highlights' table in Supabase!
    /*
    const { data: highlights, error: err5 } = await supabaseClient.from('highlights').select('*');
    if (err5) console.error("Highlights Error:", err5);
    else if (highlights && highlights.length > 0) renderHighlights(highlights);
    */
}

// ── RENDER: SPOTLIGHT ──
let spotlightItems = [];
let currentSpotlightIndex = 0;
let spotlightInterval = null;
let heroSwipeAttached = false;

function renderSpotlight(items) {
    if (!items || items.length === 0) return;
    spotlightItems = items;

    const dotsContainer = document.querySelector('.hero-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = items.map((_, i) => `<div class="${i === 0 ? 'dot-active' : 'dot-inactive'}"></div>`).join('');
    }

    updateSpotlightUI(0);

    if (items.length > 1) {
        if (!spotlightInterval) {
            spotlightInterval = setInterval(() => {
                const nextIndex = (currentSpotlightIndex + 1) % items.length;
                transitionSpotlight(nextIndex, 'next');
            }, 4000);
        }

        if (!heroSwipeAttached) {
            heroSwipeAttached = true;
            const heroElem = document.querySelector('.hero');
            if (heroElem) {
                let touchStartX = 0;
                let touchEndX = 0;

                heroElem.addEventListener('touchstart', e => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });

                heroElem.addEventListener('touchend', e => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleHeroSwipe();
                }, { passive: true });

                function handleHeroSwipe() {
                    const SWIPE_THRESHOLD = 40;
                    const diff = touchStartX - touchEndX;

                    if (Math.abs(diff) > SWIPE_THRESHOLD) {
                        let newIndex = currentSpotlightIndex;
                        let direction = 'next';

                        if (diff > 0) {
                            // Swiped left => Next
                            newIndex = (currentSpotlightIndex + 1) % items.length;
                            direction = 'next';
                        } else {
                            // Swiped right => Prev
                            newIndex = (currentSpotlightIndex - 1 + items.length) % items.length;
                            direction = 'prev';
                        }

                        // Restart the auto-sliding interval
                        if (spotlightInterval) {
                            clearInterval(spotlightInterval);
                            spotlightInterval = setInterval(() => {
                                const nextIndexIter = (currentSpotlightIndex + 1) % items.length;
                                transitionSpotlight(nextIndexIter, 'next');
                            }, 4000);
                        }

                        transitionSpotlight(newIndex, direction);
                    }
                }
            }
        }
    }
}

function transitionSpotlight(index, direction = 'next') {
    const heroGradient = document.querySelector('.hero-gradient');
    const oldBg = document.querySelector('.hero-bg:not(.sliding-out)');
    const heroTitle = document.querySelector('.hero-text h1');
    const heroSub = document.querySelector('.hero-subtitle');

    if (heroTitle) {
        heroTitle.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(8px)';
    }
    if (heroSub) {
        heroSub.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        heroSub.style.opacity = '0';
        heroSub.style.transform = 'translateY(8px)';
    }

    if (oldBg) {
        oldBg.classList.add('sliding-out');
        oldBg.style.transition = 'transform 0.5s ease-in-out';
    }

    const item = spotlightItems[index];
    const newBg = document.createElement('div');
    newBg.className = 'hero-bg';
    newBg.style.position = 'absolute';
    newBg.style.inset = '0';
    newBg.style.backgroundSize = 'cover';
    newBg.style.backgroundPosition = 'center';

    const imgUrl = item.image_url || item.img_url;
    if (imgUrl) {
        newBg.style.backgroundImage = `url(${imgUrl})`;
    }

    const startTranslate = direction === 'next' ? '100%' : '-100%';
    const endTranslateOld = direction === 'next' ? '-100%' : '100%';

    // Start the new background fully positioned to the right (or left if reversing)
    newBg.style.transform = `translateX(${startTranslate})`;
    newBg.style.transition = 'transform 0.5s ease-in-out';

    // Insert behind the gradient
    if (heroGradient && heroGradient.parentNode) {
        heroGradient.parentNode.insertBefore(newBg, heroGradient);
    }

    // Force reflow to ensure the transform jump is registered before animating
    newBg.offsetWidth;

    // Trigger slide animations
    newBg.style.transform = 'translateX(0)';
    if (oldBg) {
        oldBg.style.transform = `translateX(${endTranslateOld})`;
    }

    // Update the text while the camera is moving
    setTimeout(() => {
        updateSpotlightUI(index);
        if (heroTitle) {
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0px)';
        }
        if (heroSub) {
            heroSub.style.opacity = '1';
            heroSub.style.transform = 'translateY(0px)';
        }
    }, 250);

    // Clean up the old background element after animation completes
    setTimeout(() => {
        if (oldBg && oldBg.parentNode) {
            oldBg.parentNode.removeChild(oldBg);
        }
    }, 500);
}

function updateSpotlightUI(index) {
    currentSpotlightIndex = index;
    const item = spotlightItems[index];

    // For the initial load: Set the background of the initial hero-bg div.
    // During a transition, the transitionSpotlight function already sets the new bg's image!
    const imgUrl = item.image_url || item.img_url;
    if (!document.querySelector('.sliding-out') && imgUrl) {
        const initialBg = document.querySelector('.hero-bg');
        if (initialBg) {
            initialBg.style.backgroundImage = `url(${imgUrl})`;
            initialBg.style.backgroundSize = 'cover';
            initialBg.style.backgroundPosition = 'center';
        }
    }

    const heroTitle = document.querySelector('.hero-text h1');
    const heroSub = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');

    if (heroTitle) {
        const titleText = item.title || item.name || '';
        if (titleText) {
            const words = titleText.split(' ');
            if (words.length > 0) {
                words[0] = `<span class="hero-title-first-word">${words[0]}</span>`;
            }
            heroTitle.innerHTML = words.join('<br>');
        }
    }
    if (heroSub) heroSub.textContent = item.description || item.desc || '';

    if (heroCta && item.dish_id) {
        heroCta.setAttribute('onclick', `location.href='dish-detail.html?id=${item.dish_id}'`);
    }

    // Dots
    const dots = document.querySelectorAll('.hero-dots div');
    dots.forEach((dot, i) => {
        dot.className = i === index ? 'dot-active' : 'dot-inactive';
    });
}

// ── RENDER: PRIMARY CATEGORIES ──
const CAT_GRADIENTS = [
    // 'linear-gradient(135deg,#3a2a1a 0%,#5c3a20 100%)',
    // 'linear-gradient(135deg,#2a3a1a 0%,#3a5c20 100%)',
    // 'linear-gradient(135deg,#1a2a3a 0%,#203a5c 100%)',
    // 'linear-gradient(135deg,#3a1a1a 0%,#5c2020 100%)'
];

function renderCategories(items) {
    const container = document.querySelector('.banner-cards-scroll');
    if (!container) return;

    let html = '';
    items.forEach((cat, index) => {
        const bgStyle = CAT_GRADIENTS[index % CAT_GRADIENTS.length];
        const iconUrl = cat.icon_url || cat.image_url || 'Images/default.png';
        const subTitle = cat.description || cat.subtitle || 'Explore category';

        html += `
            <div class="banner-card" onclick="location.href='category.html?categoryId=${cat.id}'">
                <div class="banner-card-img" style="background:${bgStyle};">
                    <img src="${iconUrl}" alt="${cat.name}" />
                </div>
                <div class="banner-card-meta">
                    <div class="banner-card-title-row">
                        <span class="banner-card-title">${cat.name}</span>
                        <div class="banner-card-arrow">
                            <img src="Images/Arrow.svg" alt="→" />
                        </div>
                    </div>
                    <span class="banner-card-sub">${subTitle}</span>
                </div>
            </div>
        `;
    });

    // add placeholder block for layout spacing at end
    html += '<div class="banner-card-placeholder"></div>';

    container.innerHTML = html;
}

// ── RENDER: MOST ORDERED ──
function renderMostOrdered(items) {
    const container = document.querySelector('.dishes-scroll');
    if (!container) return;

    let html = '';
    items.forEach(item => {
        const vegHTML = item.is_veg
            ? `<span class="tag-veg"><img class="tag-veg-dot" src="https://www.figma.com/api/mcp/asset/198dc533-2ac2-46ad-93ab-53a6cc47bf8e" alt="veg"/>Veg</span>`
            : `<span class="tag-veg" style="color:#e02020;"><img class="tag-veg-dot" src="https://www.figma.com/api/mcp/asset/94a5d554-2911-4275-9554-60b130130f95" alt="non-veg"/>Non Veg</span>`;

        // If 'dish_id' exists on most_ordered link to it, otherwise default
        const linkId = item.dish_id || item.id;

        // Build derived values for the special table format if present
        let timeEstimate = item.time_estimate || item.prep_time || '20-25 mins';
        if (item.prep_time_min && item.prep_time_max) {
            timeEstimate = `${item.prep_time_min}-${item.prep_time_max} mins`;
        } else if (item.prep_time_min) {
            timeEstimate = `${item.prep_time_min} mins`;
        }

        const subLabel = item.category || item.type_label || item.cuisine_type || '';
        const imgUrl = item.img_url || item.image_url || 'Images/card1.png';
        const price = item.price ? `₹${item.price}` : '';

        html += `
            <div class="dish-card" onclick="location.href='dish-detail.html?id=${linkId}'">
                <div class="dish-card-img">
                    <img src="${imgUrl}" alt="${item.name}" />
                    <div class="dish-card-overlay"></div>
                    <div class="dish-card-info">
                        <div>
                            <div class="dish-card-name">${item.name}</div>
                            <div class="dish-card-sub">${subLabel}</div>
                        </div>
                        <div class="dish-arrow">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        </div>
                    </div>
                </div>
                <div class="dish-meta">
                    <div class="dish-tags">
                        ${vegHTML}
                        <span class="tag-sep">|</span>
                        <span class="tag-time">${timeEstimate}</span>
                    </div>
                    <div class="dish-price">${price}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ── RENDER: POPULAR CATEGORIES ──
function renderPopularCategories(items) {
    const container = document.querySelector('.pop-cats-scroll');
    if (!container) return;

    let html = '';
    items.forEach(cat => {
        // The user specifically requested that the single image from the row
        // be duplicated across all three overlapping avatars in the pill!
        const imageUrl = cat.image_url || cat.img_url || '';
        const avatarsHTML = `
            <div class="chip-av"><img src="${imageUrl}" alt=""/></div>
            <div class="chip-av"><img src="${imageUrl}" alt=""/></div>
            <div class="chip-av"><img src="${imageUrl}" alt=""/></div>
        `;

        html += `
            <div class="cat-chip" onclick="location.href='category.html?categoryId=${cat.id}'">
                <div class="cat-chip-avatars">${avatarsHTML}</div>
                <span class="cat-chip-name">${cat.name}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ── RENDER: HIGHLIGHTS ──
function renderHighlights(items) {
    const container = document.querySelector('.stories-row');
    if (!container) return;

    // Retain the static "Add Story" block at the start
    let html = `
        <div class="story-add">
            <div class="story-add-inner">
                <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
                    <rect x="4" y="4" width="23" height="23" rx="3" stroke="#808080" stroke-width="1.5" />
                    <circle cx="12" cy="12" r="2" stroke="#808080" stroke-width="1.5" />
                    <path d="M4 20L9 15L13 19L19 13L27 21" stroke="#808080" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </div>
            <div class="story-plus">
                <svg viewBox="0 0 8 8" fill="none"><path d="M4 1V7M1 4H7" stroke="white" stroke-width="1.5" stroke-linecap="round" /></svg>
            </div>
        </div>
    `;

    items.forEach(h => {
        html += `
            <div class="story-item">
                <img src="${h.img_url}" alt="Story" style="object-fit:cover; width:100%; height:100%; border-radius:50%;" />
            </div>
        `;
    });

    container.innerHTML = html;
}
