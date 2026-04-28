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

    // 3. Dish Tabs (Dynamically fetched from dishes table)
    await setupDishTabs();

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

// ── RENDER: TAB DISHES ──
async function fetchTabDishes(filterValue) {
    const { data: dishes, error } = await supabaseClient.from('dishes')
        .select('*')
        .contains('featured_in', [filterValue]);

    if (error) console.error(`Error fetching dishes for tab ${filterValue}:`, error);
    else renderTabDishes(dishes || []);
}

async function setupDishTabs() {
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;

    // Fetch all featured_in arrays to get unique tabs
    const { data, error } = await supabaseClient.from('dishes').select('featured_in');
    
    let filtersSet = new Set();
    if (!error && data) {
        data.forEach(item => {
            if (Array.isArray(item.featured_in)) {
                item.featured_in.forEach(f => filtersSet.add(f));
            }
        });
    }

    let filters = Array.from(filtersSet);
    
    // Fallback if no data is found
    if (filters.length === 0) {
        filters = ['most_ordered', 'signature', 'budget'];
    }

    // Sort logic: keep most_ordered first, signature second
    const priority = ['most_ordered', 'signature', 'budget'];
    filters.sort((a, b) => {
        const indexA = priority.indexOf(a);
        const indexB = priority.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    const formatLabel = (str) => {
        return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    let tabsHTML = '';
    filters.forEach((filter, index) => {
        const label = formatLabel(filter);
        const spanClass = index === 0 ? 'tab-label-active' : 'tab-label-inactive';
        tabsHTML += `
            <div class="tab-item" data-filter="${filter}">
                <span class="${spanClass}">${label}</span>
            </div>
        `;
    });
    
    tabsHTML += `<div class="tab-active-bar"></div>`;
    tabBar.innerHTML = tabsHTML;

    const tabItems = document.querySelectorAll('.tab-item');
    const activeBar = document.querySelector('.tab-active-bar');

    const moveActiveBar = (tab) => {
        if (activeBar) {
            const span = tab.querySelector('span');
            if (span) {
                const containerRect = tab.parentElement.getBoundingClientRect();
                const spanRect = span.getBoundingClientRect();
                // Relative to parent container's visible area, accounting for scroll
                const offsetLeft = spanRect.left - containerRect.left + tab.parentElement.scrollLeft;
                
                activeBar.style.left = `${offsetLeft}px`;
                activeBar.style.width = `${spanRect.width}px`;
            }
        }
    };

    tabItems.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Update active state
            tabItems.forEach((t, i) => {
                const span = t.querySelector('span');
                const labelName = span ? span.innerText.trim() : t.innerText.trim();
                if (i === index) {
                    t.innerHTML = `<span class="tab-label-active">${labelName}</span>`;
                } else {
                    t.innerHTML = `<span class="tab-label-inactive">${labelName}</span>`;
                }
            });

            // Move the active bar and center the tab
            setTimeout(() => {
                moveActiveBar(tab);

                // Scroll the tab bar to center the active tab
                const scrollLeftPos = tab.offsetLeft - (tabBar.clientWidth / 2) + (tab.clientWidth / 2);
                tabBar.scrollTo({
                    left: scrollLeftPos,
                    behavior: 'smooth'
                });
            }, 10);

            // Fetch dishes for this tab
            fetchTabDishes(filters[index]);
        });
    });

    // Initial setup
    setTimeout(() => {
        if (tabItems[0]) moveActiveBar(tabItems[0]);
    }, 100);

    // Initial fetch
    fetchTabDishes(filters[0]);
}

function renderTabDishes(items) {
    const container = document.querySelector('.dish-grid');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div style="padding: 20px; color: #888;">No dishes found.</div>`;
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const isVeg = item.is_veg;
        const vegIcon = isVeg ? 'Images/veg dot.svg' : 'Images/non veg dot.svg';
        const vegLabel = isVeg ? 'Veg' : 'Non-Veg';
        const vegClass = isVeg ? 'veg-indicator' : 'nonveg-indicator';
        const tagClass = isVeg ? 'tag-veg-label' : 'tag-nonveg-label';

        const linkId = item.dish_id || item.id;
        let timeEstimate = item.time_estimate || item.prep_time || '20-25 mins';
        if (item.prep_time_min && item.prep_time_max) {
            timeEstimate = `${item.prep_time_min}-${item.prep_time_max} mins`;
        } else if (item.prep_time_min) {
            timeEstimate = `${item.prep_time_min} mins`;
        }

        const imgUrl = item.img_url || item.image_url || 'Images/hero3.jpg';
        const price = item.price ? `₹${item.price}` : '';

        html += `
            <div class="dish-card" onclick="location.href='dish-detail.html?id=${linkId}'" style="animation: slideUpFadeIn 0.4s ease forwards; animation-delay: ${index * 0.08}s; opacity: 0;">
                <div class="dish-card-img-wrap">
                    <img src="${imgUrl}" alt="${item.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
                    <button class="dish-add-btn"><span>+</span></button>
                </div>
                <div class="dish-card-meta">
                    <div class="dish-card-name">${item.name}</div>
                    <div class="dish-card-tags">
                        <div class="${vegClass}">
                            <img src="${vegIcon}" alt="">
                        </div>
                        <span class="${tagClass}">${vegLabel}</span>
                        <span class="tag-sep">|</span>
                        <span class="tag-time">${timeEstimate}</span>
                    </div>
                    <div class="dish-price-row">
                        <span class="dish-price">${price}</span>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    // Update pagination
    const scrollWrap = document.querySelector('.dish-grid-wrap');
    const thumb = document.querySelector('.carousel-thumb');
    const paginationContainer = document.querySelector('.carousel-pagination');

    const updatePagination = () => {
        if (!scrollWrap || !thumb || !paginationContainer) return;
        
        const maxScroll = scrollWrap.scrollWidth - scrollWrap.clientWidth;
        
        // Hide pagination if not scrollable
        if (maxScroll <= 0) {
            paginationContainer.style.display = 'none';
            return;
        } else {
            paginationContainer.style.display = 'flex';
        }
        
        const scrollRatio = scrollWrap.scrollLeft / maxScroll;
        const trackWidth = 48;
        const thumbWidth = Math.max(16, (scrollWrap.clientWidth / scrollWrap.scrollWidth) * trackWidth);
        
        thumb.style.width = `${thumbWidth}px`;
        thumb.style.left = `${scrollRatio * (trackWidth - thumbWidth)}px`;
    };

    if (scrollWrap) {
        // Remove existing listener to avoid duplicates if renderTabDishes is called multiple times
        scrollWrap.removeEventListener('scroll', updatePagination);
        scrollWrap.addEventListener('scroll', updatePagination);
        
        // Reset scroll position when loading new tab
        scrollWrap.scrollLeft = 0;
        
        // Initial pagination update
        setTimeout(updatePagination, 50);
    }
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
