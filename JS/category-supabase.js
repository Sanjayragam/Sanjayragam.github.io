// category-supabase.js

let allDishesForCategory = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');

    if (categoryId) {
        fetchCategoryData(categoryId);
    } else {
        console.warn("No category ID provided in URL");
    }
});

async function fetchCategoryData(categoryId) {
    if (!window.supabase) return console.error('Supabase client missing!');

    try {
        // 1. Fetch the category details
        let category = null;
        let isMainCategory = false;

        // Try 'categories' table first (Main Categories)
        const { data: cat1 } = await supabaseClient.from('categories').select('*').eq('id', categoryId).single();
        if (cat1) {
            category = cat1;
            isMainCategory = true;
        } else {
            // Fallback to 'popular_categories'
            const { data: cat2 } = await supabaseClient.from('popular_categories').select('*').eq('id', categoryId).single();
            if (cat2) category = cat2;
        }

        if (category) {
            const titleEl = document.querySelector('.cat-heading-title');
            if (titleEl) titleEl.textContent = category.name;
            const heroDesc = document.querySelector('.hero-desc');
            if (heroDesc) heroDesc.textContent = category.description || '';
        }

        // 2. Fetch all dishes for this category
        // If it's a main category (like Starters), use main_category_id. Otherwise, use category_id
        const columnToQuery = isMainCategory ? 'main_category_id' : 'category_id';
        const { data: dishes } = await supabaseClient.from('dishes').select('*').eq(columnToQuery, categoryId);

        if (dishes && dishes.length > 0) {
            allDishesForCategory = dishes;

            // Extract unique cuisines
            let cuisinesSet = new Set();
            dishes.forEach(dish => {
                if (dish.cuisine_type) {
                    // Split by comma in case multiple cuisines are listed
                    const parts = dish.cuisine_type.split(',').map(s => s.trim()).filter(Boolean);
                    parts.forEach(p => cuisinesSet.add(p));
                }
            });

            let cuisines = Array.from(cuisinesSet);
            if (cuisines.length === 0) cuisines = ['All'];

            renderCuisineTabs(cuisines);
        } else {
            console.log("No dishes found for this category.");
            document.querySelector('.dish-grid').innerHTML = '<p style="color:#111; padding:20px;">No dishes available.</p>';
        }

    } catch (err) {
        console.error('Error fetching category data:', err);
    }
}

function renderCuisineTabs(cuisines) {
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;

    let tabsHTML = '';
    cuisines.forEach((cuisine, index) => {
        const spanClass = index === 0 ? 'tab-label-active' : 'tab-label-inactive';
        tabsHTML += `
            <div class="tab-item" data-cuisine="${cuisine}">
                <span class="${spanClass}">${cuisine}</span>
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

                const scrollLeftPos = tab.offsetLeft - (tabBar.clientWidth / 2) + (tab.clientWidth / 2);
                tabBar.scrollTo({
                    left: scrollLeftPos,
                    behavior: 'smooth'
                });
            }, 10);

            // Render dishes for this cuisine
            filterAndRenderDishes(cuisines[index]);
        });
    });

    // Initial setup
    setTimeout(() => {
        if (tabItems[0]) moveActiveBar(tabItems[0]);
    }, 100);

    // Initial render
    filterAndRenderDishes(cuisines[0]);
}

function filterAndRenderDishes(cuisine) {
    let filteredDishes = allDishesForCategory;
    if (cuisine !== 'All') {
        filteredDishes = allDishesForCategory.filter(dish => {
            if (!dish.cuisine_type) return false;
            const parts = dish.cuisine_type.split(',').map(s => s.trim());
            return parts.includes(cuisine);
        });
    }
    renderDishGrid(filteredDishes);
}

function renderDishGrid(items) {
    const container = document.querySelector('.dish-grid');
    if (!container) return;

    let html = '';
    items.forEach((item, index) => {
        const isVeg = item.is_veg;
        const vegIconClass = isVeg ? 'veg-indicator' : 'nonveg-indicator';
        const vegLabelClass = isVeg ? 'tag-veg-label' : 'tag-nonveg-label';
        const vegText = isVeg ? 'Veg' : 'Non-veg';

        // Add staggered animation delay
        const delay = index * 0.1;

        html += `
            <div class="dish-card" onclick="location.href='dish-detail.html?id=${item.id}'" style="animation: slideUpFadeIn 0.5s ease forwards; animation-delay: ${delay}s; opacity: 0;">
                <div class="dish-card-img-wrap">
                    <img src="${item.image_url || item.img_url || ''}" alt="${item.name}" />
                    <button class="dish-add-btn" onclick="event.stopPropagation(); alert('Added to cart!');">
                        <span>+</span>
                    </button>
                </div>
                <div class="dish-card-meta">
                    <div class="dish-card-name">${item.name}</div>
                    <div class="dish-card-tags">
                        <div class="${vegIconClass}"><div class="dot"></div></div>
                        <span class="${vegLabelClass}">${vegText}</span>
                        <span class="tag-sep">|</span>
                        <span class="tag-time">${item.prep_time || '20-25 mins'}</span>
                    </div>
                    <div class="dish-price-row">
                        <div class="dish-price">₹${item.price}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
