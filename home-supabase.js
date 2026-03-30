// home-supabase.js

document.addEventListener('DOMContentLoaded', () => {
    fetchHomepageData();
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
    const { data: categories, error: err2 } = await supabaseClient.from('categories').select('*');
    if (err2) console.error("Categories Error:", err2);
    else if (categories && categories.length > 0) renderCategories(categories);

    // 3. Most Ordered (Dynamically fetching Top 5 rated items from the 'dishes' table)
    const { data: mostOrdered, error: err3 } = await supabaseClient.from('dishes')
        .select('*')
        .order('rating', { ascending: false })
        .limit(5);
        
    if (err3) console.error("Most Ordered Error:", err3);
    else if (mostOrdered && mostOrdered.length > 0) renderMostOrdered(mostOrdered);

    // 4. Popular Categories
    const { data: popCategories, error: err4 } = await supabaseClient.from('popular_categories').select('*');
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

function renderSpotlight(items) {
    if (!items || items.length === 0) return;
    spotlightItems = items;

    const dotsContainer = document.querySelector('.hero-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = items.map((_, i) => `<div class="${i === 0 ? 'dot-active' : 'dot-inactive'}"></div>`).join('');
    }

    updateSpotlightUI(0);

    if (items.length > 1 && !spotlightInterval) {
        spotlightInterval = setInterval(() => {
            const nextIndex = (currentSpotlightIndex + 1) % items.length;
            transitionSpotlight(nextIndex);
        }, 4000);
    }
}

function transitionSpotlight(index) {
    const heroBg = document.querySelector('.hero-bg');
    const heroText = document.querySelector('.hero-text');
    
    if (heroBg) heroBg.style.opacity = '0';
    if (heroText) heroText.style.opacity = '0';

    setTimeout(() => {
        updateSpotlightUI(index);
        if (heroBg) heroBg.style.opacity = '1';
        if (heroText) heroText.style.opacity = '1';
    }, 500);
}

function updateSpotlightUI(index) {
    currentSpotlightIndex = index;
    const item = spotlightItems[index];

    const heroBg = document.querySelector('.hero-bg');
    const heroTitle = document.querySelector('.hero-text h1');
    const heroSub = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');

    const imgUrl = item.image_url || item.img_url;
    if (heroBg && imgUrl) {
        heroBg.style.backgroundImage = `url(${imgUrl})`;
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center';
    }

    if (heroTitle) {
        const titleText = item.title || item.name || '';
        if (titleText) {
            const words = titleText.split(' ');
            heroTitle.innerHTML = words.join('<br>'); 
        }
    }
    if (heroSub) heroSub.textContent = item.description;

    // Route CTA to the dish-detail if spotlight has a specific referenced dish ID
    // If not, we just rely on generic routing or keep the visual CTA
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
const CAT_STYLES = ['cat-card-main', 'cat-card-starters', 'cat-card-vegs'];
function renderCategories(items) {
    const container = document.querySelector('.categories-scroll');
    if (!container) return;

    let html = '';
    items.forEach((cat, index) => {
        const styleClass = CAT_STYLES[index % CAT_STYLES.length];
        
        // Use standard labels and image positions
        // We link directly to category.html passing the ID
        html += `
            <div class="cat-card ${styleClass}" onclick="location.href='category.html?categoryId=${cat.id}'">
                <span class="cat-label ${styleClass.replace('cat-card', 'cat-label')}">${cat.name}</span>
                <img class="cat-img" src="${cat.icon_url}" alt="${cat.name}" style="position:absolute;right:-20px;bottom:0;width:130px; object-fit:contain;"/>
            </div>
        `;
    });
    
    // add placeholder block for layout spacing at end
    html += '<div class="cat-placeholder"></div>';
    
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

        html += `
            <div class="dish-card" onclick="location.href='dish-detail.html?id=${linkId}'">
                <div class="dish-card-img">
                    <img src="${item.img_url}" alt="${item.name}" />
                    <div class="dish-card-overlay"></div>
                    <div class="dish-card-info">
                        <div>
                            <div class="dish-card-name">${item.name}</div>
                            <div class="dish-card-sub">${item.type_label || item.cuisine_type || ''}</div>
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
                        <span class="tag-time">${item.time_estimate || item.prep_time || '20-25 mins'}</span>
                    </div>
                    <div class="dish-price">₹${item.price}</div>
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
        // Build the overlapping avatars dynamically if arrays exist, otherwise use single image 
        let avatarsHTML = '';
        if (cat.avatar_urls && Array.isArray(cat.avatar_urls)) {
            avatarsHTML = cat.avatar_urls.map(url => `<div class="chip-av"><img src="${url}" alt=""/></div>`).join('');
        } else {
            // Fallback for visual styling
            avatarsHTML = `
                <div class="chip-av"><img src="${cat.img_url || ''}" alt=""/></div>
                <div class="chip-av"></div>
                <div class="chip-av"></div>
            `;
        }
        
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
