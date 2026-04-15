/* =========================
   SEARCH PAGE LOGIC
========================= */

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const mode = params.get("m") || "product";

    const searchInput = document.getElementById("searchInput");
    const searchTypeBtn = document.getElementById("searchTypeBtn");

    if (searchInput) searchInput.value = query;
    if (searchTypeBtn) {
        searchTypeBtn.innerText = mode.charAt(0).toUpperCase() + mode.slice(1) + "s";
        window.searchMode = mode; // Ensure global mode is set
    }

    // Wait for data to be ready (ALL_PRODUCTS is fetched in home.js or similar)
    const checkData = setInterval(() => {
        const productsReady = window.ALL_PRODUCTS && window.ALL_PRODUCTS.length > 0;
        const recipesReady = window.ALL_RECIPES && window.ALL_RECIPES.length > 0;
        
        if (mode === "product" && productsReady) {
            clearInterval(checkData);
            performSearch(query, mode);
        } else if (mode === "recipe" && recipesReady && productsReady) {
            clearInterval(checkData);
            performSearch(query, mode);
        }
    }, 100);

    // Re-init search input for the search page itself
    initSearchPageNav();
});

function initSearchPageNav() {
    const searchInput = document.getElementById("searchInput");
    const searchExecBtn = document.getElementById("searchExecBtn");

    if (!searchInput) return;

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            executeSearch();
        }
    });

    if (searchExecBtn) {
        searchExecBtn.addEventListener("click", executeSearch);
    }
}

function executeSearch() {
    const query = document.getElementById("searchInput").value.trim();
    const mode = window.searchMode || "product";
    if (query) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}&m=${mode}`;
    } else {
        window.location.href = "home.html";
    }
}

function performSearch(query, mode) {
    const container = document.getElementById("searchResults");
    const title = document.getElementById("searchTitle");
    if (!container) return;

    if (!query) {
        title.innerText = "Please enter a search term";
        container.innerHTML = "";
        return;
    }

    title.innerText = `Results for "${query}" in ${mode}s`;

    if (mode === "product") {
        const results = (window.SEARCH_INDEX || []).filter(p => 
            p.searchKey && p.searchKey.includes(query.toLowerCase())
        );
        renderProductResultsLocal(results, container);
    } else {
        renderRecipeResultsLocal(query.toLowerCase(), container);
    }
}

function renderProductResultsLocal(items, container) {
    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "vertical-grid";

    if (!items.length) {
        grid.innerHTML = "<p style='padding:20px'><b>No products found</b></p>";
    } else {
        const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
        grid.innerHTML = items.map(p => {
            if (window.getProductCardHTML) {
                return window.getProductCardHTML(p, cart);
            }
            return `<div class="product-card"><h3>${p.name}</h3></div>`; // Fallback
        }).join("");
    }
    container.appendChild(grid);
}

function renderRecipeResultsLocal(query, container) {
    const q = query.toLowerCase().trim();
    const recipes = window.ALL_RECIPES || [];

    // Scored filtering logic (Restored from home.js)
    const scoredData = recipes.map(r => {
        let score = 0;
        const nameStr = r.name.toLowerCase();

        // 1. Title matches
        if (nameStr === q) score += 100;
        else if (nameStr.startsWith(q)) score += 50;
        else if (nameStr.includes(q)) score += 30;

        // 2. Cuisine/Tag matches
        if (r.cuisine && r.cuisine.toLowerCase().includes(q)) score += 10;

        // 3. Ingredient matches
        if (window.ALL_PRODUCTS && r.ingredients) {
            const ingredientMatch = r.ingredients.some(item => {
                const product = window.ALL_PRODUCTS.find(p => p.id === item.productId);
                return product && product.name.toLowerCase().includes(q);
            });
            if (ingredientMatch) score += 20;
        }

        // 4. Section options matches
        if (r.sections) {
            const sectionMatch = r.sections.some(sec =>
                sec.options.some(opt => opt.name && opt.name.toLowerCase().includes(q))
            );
            if (sectionMatch) score += 20;
        }

        return { ...r, score };
    });

    // Filtering and Deduplication
    const matchedScored = scoredData.filter(r => r.score > 0);
    const uniqueMap = {};
    matchedScored.forEach(r => {
        const baseName = r.name.replace(/\s*\(Var\.\s*\d+\)\s*/i, "").trim();
        if (!uniqueMap[baseName] || r.score > uniqueMap[baseName].score) {
            uniqueMap[baseName] = r;
        }
    });

    const matched = Object.values(uniqueMap).sort((a, b) => b.score - a.score);

    if (matched.length === 0) {
        container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <i class="ri-search-line" style="font-size: 48px; color: #ddd; margin-bottom: 15px; display: block;"></i>
                <h3 style="color: #3b1a86;">No recipes found for '${query}'</h3>
                <p style="color: #888; font-size: 14px;">Try checking for typos or using broader keywords.</p>
            </div>
        `;
        return;
    }

    const groups = matched.reduce((acc, r) => {
        const c = r.cuisine || "Other";
        if (!acc[c]) acc[c] = [];
        acc[c].push(r);
        return acc;
    }, {});

    container.innerHTML = "";
    Object.entries(groups).forEach(([cuisine, recs]) => {
        const section = document.createElement("section");
        section.className = "product-section";
        section.innerHTML = `
            <div class="section-header"><h2>${cuisine} Recipes</h2></div>
            <div class="vertical-grid">
                ${recs.map(r => `
                    <div class="product-card recipe-result">
                        <div class="product-img-wrap">
                            <img src="${r.image || 'assets/images/placeholder.jpg'}" alt="${r.name}" onerror="this.src='assets/images/placeholder.jpg'">
                        </div>
                        <div class="product-name">${r.name}</div>
                        <div class="product-bottom">
                            <button class="add-btn" data-recipe-id="${r.id}" style="width: 100%; border: 1.5px solid #3b1a86; border-radius: 8px; font-weight: 600;">
                                Add ingredients
                            </button>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
        container.appendChild(section);
    });
}
