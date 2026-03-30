// category-supabase.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('categoryId');
    
    if (categoryId) {
        fetchCategoryData(categoryId);
    } else {
        console.warn("No category ID provided in URL");
        // Fallback or handle missing ID visually if you like
    }
});

async function fetchCategoryData(categoryId) {
    if (!window.supabase) return console.error('Supabase client missing!');

    try {
        // 1. Fetch the category details (Assuming 'popular_categories' per schema)
        const { data: category } = await supabaseClient.from('popular_categories').select('*').eq('id', categoryId).single();
        if (category) {
            const titleEl = document.querySelector('.cat-heading-title');
            if (titleEl) titleEl.textContent = category.name;
            const heroDesc = document.querySelector('.hero-desc');
            if (heroDesc) heroDesc.textContent = category.description || '';
            const secLabel = document.querySelector('.section-label');
            if (secLabel) secLabel.textContent = category.name; 
        }

        // 2. Fetch all categories for the tab bar
        const { data: allCategories } = await supabaseClient.from('popular_categories').select('*').order('id');
        if (allCategories) {
            renderTabs(allCategories, categoryId);
        }

        // 3. Fetch dishes for this category
        const { data: dishes } = await supabaseClient.from('dishes').select('*').eq('category_id', categoryId);
        if (dishes) {
            const secLabel = document.querySelector('.section-label');
            if (secLabel && category) {
                secLabel.textContent = `${category.name} (${dishes.length})`;
            }
            renderDishGrid(dishes);
        }

    } catch (err) {
        console.error('Error fetching category data:', err);
    }
}

function renderTabs(categories, activeCategoryId) {
    const container = document.querySelector('.category-tabs');
    if (!container) return;

    let html = '';
    categories.forEach(cat => {
        const isActive = cat.id === activeCategoryId ? 'active' : '';
        const labelClass = cat.id === activeCategoryId ? 'tab-label' : 'tab-label-inactive';
        
        let iconSvg = '';
        if (cat.icon_url) {
            iconSvg = `<img src="${cat.icon_url}" alt="${cat.name}" style="width:20px; height:20px; object-fit:contain;"/>`;
        } else if (cat.img_url) {
            iconSvg = `<img src="${cat.img_url}" alt="${cat.name}" style="width:20px; height:20px; object-fit:cover; border-radius:10px;"/>`;
        } else {
            iconSvg = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="4" stroke="#808080" stroke-width="1.5"/></svg>`;
        }

        html += `
            <div class="tab-item ${isActive}" onclick="location.href='category.html?categoryId=${cat.id}'">
              <div class="tab-icon">${iconSvg}</div>
              <span class="${labelClass}">${cat.name}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderDishGrid(items) {
    const container = document.querySelector('.dish-grid');
    if (!container) return;

    let html = '';
    items.forEach(item => {
        // Simple red/green logic
        const isVeg = item.is_veg;
        const vegIcon = isVeg 
            ? `<img src="https://www.figma.com/api/mcp/asset/e6b096fe-5736-4a27-8cf4-e82813dde0dd" alt="veg"/>` 
            : `<img src="https://www.figma.com/api/mcp/asset/e6b096fe-5736-4a27-8cf4-e82813dde0dd" alt="non-veg" style="filter: hue-rotate(180deg);"/>`;
        const vegLabel = isVeg ? 'Veg' : 'Non-Veg';

        html += `
          <div class="dish-grid-item" onclick="location.href='dish-detail.html?id=${item.id}'">
            <div class="dish-grid-img">
              <img src="${item.image_url || ''}" alt="${item.name}" />
              <div class="dish-veg-badge">
                ${vegIcon} ${vegLabel}
              </div>
            </div>
            <div class="dish-info">
              <div class="dish-name">${item.name}</div>
              <div class="dish-meta-row">
                <span class="dish-type-veg">
                   ${vegIcon}
                  ${vegLabel}
                </span>
                <span class="dish-sep">|</span>
                <span class="dish-time">${item.prep_time || '20-25 mins'}</span>
              </div>
              <div class="dish-kitchen">${item.cuisine_type || ''}</div>
              <div class="dish-price-sm">₹${item.price}</div>
            </div>
          </div>
        `;
    });
    container.innerHTML = html;
}
