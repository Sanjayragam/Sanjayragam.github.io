// dish-detail-supabase.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');
    
    if (dishId) {
        fetchDishData(dishId);
    } else {
        console.warn("No dish ID provided in URL");
    }
});

async function fetchDishData(dishId) {
    if (!window.supabase) return console.error('Supabase client missing!');

    try {
        // 1. Fetch the main dish joined with popular_categories for the breadcrumb
        // Since the schema says `category_id` references `popular_categories (id)`, we can join:
        const { data: dish, error } = await supabaseClient
            .from('dishes')
            .select('*, popular_categories(name)')
            .eq('id', dishId)
            .single();

        if (error) {
            console.error('Error fetching dish:', error);
            return;
        }

        if (dish) {
            renderDishDetails(dish);
            
            // 2. Fetch related dishes from the same category
            const { data: related } = await supabaseClient
                .from('dishes')
                .select('*')
                .eq('category_id', dish.category_id)
                .neq('id', dish.id)
                .limit(5);

            if (related) {
                renderRelatedDishes(related);
            }
        }

    } catch (err) {
        console.error('Exception fetching dish data:', err);
    }
}

function renderDishDetails(dish) {
    // Breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb && dish.popular_categories) {
        // Keep the SVG if possible, just update text node
        const svgHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12 C2 8, 7 4, 8 2 C9 4, 14 8, 14 12" stroke="#6c6c6c" stroke-width="1.3" stroke-linecap="round" /></svg>`;
        breadcrumb.innerHTML = `${svgHTML} In ${dish.popular_categories.name.toLowerCase()}`;
        
        // Setup breadcrumb back link
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.href = `category.html?categoryId=${dish.category_id}`;
            backBtn.querySelector('span').textContent = 'BACK';
        }
    }

    // Name
    const nameEl = document.querySelector('.dish-main-name');
    if (nameEl) nameEl.textContent = dish.name;

    // Veg / Non-Veg
    const typeRow = document.querySelector('.dish-type-row');
    if (typeRow) {
        const isVeg = dish.is_veg;
        const vegIcon = isVeg 
            ? `<img src="https://www.figma.com/api/mcp/asset/e6b096fe-5736-4a27-8cf4-e82813dde0dd" alt="veg" style="width:18px;height:18px;"/>` 
            : `<img src="https://www.figma.com/api/mcp/asset/94a5d554-2911-4275-9554-60b130130f95" alt="non-veg" style="width:18px;height:18px;"/>`;
        const vegText = isVeg ? 'Veg' : 'Non veg';
        const colorClass = isVeg ? 'color:#10ac33;' : 'color:#ee1e25;';

        typeRow.innerHTML = `
            <span style="display:flex;align-items:center;gap:4px;${colorClass}">
                ${vegIcon} ${vegText}
            </span>
            <span class="dot-sep">•</span>
            <span class="cook-time">${dish.prep_time || '20-25 mins'}</span>
        `;
    }

    // Cuisine
    const cuisineEl = document.querySelector('.dish-kitchen');
    if (cuisineEl) cuisineEl.textContent = dish.cuisine_type || '';

    // Price
    const priceEl = document.querySelector('.dish-price-lg');
    if (priceEl) priceEl.textContent = `₹${dish.price}`;

    // 3D Model
    const viewerContainer = document.querySelector('#dishContainer');
    if (viewerContainer) {
        // If there's a 3D model, inject model viewer, else fallback to 2D image
        if (dish.model_url) {
            viewerContainer.innerHTML = `
                <model-viewer src="${dish.model_url}" camera-controls
                  auto-rotate shadow-intensity="1" alt="${dish.name}" class="dish-3d-model"
                  max-camera-orbit="auto 90deg auto"></model-viewer>
            `;
        } else {
            viewerContainer.innerHTML = `
                <img src="${dish.image_url}" alt="${dish.name}" style="width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 20px 40px rgba(0,0,0,0.15));"/>
            `;
        }
    }
}

function renderRelatedDishes(items) {
    const container = document.querySelector('.related-scroll');
    if (!container) return;
    
    // If no related items, maybe hide the bottom section
    if (items.length === 0) {
        document.querySelector('.bottom-section').style.display = 'none';
        return;
    }

    let html = '';
    items.forEach(item => {
        html += `
            <div class="related-card" onclick="location.href='dish-detail.html?id=${item.id}'">
                <div class="related-img">
                  <img src="${item.image_url}" alt="${item.name}" />
                </div>
                <div class="related-info">
                  <div class="related-name">${item.name}</div>
                  <div class="related-meta">
                    <svg viewBox="0 0 16 16" fill="#f5a623"><path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" /></svg>
                    ${item.rating || '4.5'}
                    <span>•</span>
                    ${item.prep_time || '20 mins'}
                  </div>
                  <div class="related-price">₹${item.price}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}
