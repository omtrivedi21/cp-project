document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    window.ALL_PRODUCTS = await res.json();
  } catch (err) {
    console.error("Error loading products:", err);
    const grid = document.getElementById("grid");
    if (grid) grid.innerHTML = `<p style='padding:20px; color:red;'>Server Error: ${err.message}</p>`;
    return;
  }

  // if (window.initGlobalClicks) {
  //   window.initGlobalClicks();
  // } else {
  //   console.warn("initGlobalClicks not found in window");
  // }

  if (!window.ALL_PRODUCTS || !window.ALL_PRODUCTS.length) {
    console.error("ALL_PRODUCTS missing or empty");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const recipeId = params.get("recipeId");
  const sectionTitle = params.get("section");
  const type = params.get("type");
  const cuisine = params.get("cuisine");

  const title = document.getElementById("title");
  const grid = document.getElementById("grid");

  if (recipeId) {
    if (!window.ALL_RECIPES) {
      await fetchRecipes();
    }
    const recipe = (window.ALL_RECIPES || []).find(r => r.id == recipeId);
    if (recipe) {
      const catSection = document.getElementById("catSection");
      const categoryScroll = document.getElementById("categoryScroll");
      
      if (catSection && categoryScroll) {
        catSection.style.display = "block";
        categoryScroll.innerHTML = "";

        // 🔥 ADD "ALL" BUTTON IF SECTIONS EXIST
        if (recipe.sections && recipe.sections.length > 0) {
          const allBtn = document.createElement("button");
          allBtn.className = "category-btn";
          allBtn.innerHTML = `
            <img src="assets/images/dairy.jpeg" onerror="this.src='assets/images/dairy.jpeg'">
            <span>All</span>
          `;
          allBtn.onclick = () => {
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            allBtn.classList.add("active");
            filterByRecipeSection(recipe, "All");
          };
          categoryScroll.appendChild(allBtn);
        }

        recipe.sections?.forEach(sec => {
          const btn = document.createElement("button");
          btn.className = "category-btn";
          if (sec.title === sectionTitle) btn.classList.add("active");

          let imgPath = "assets/images/dairy.jpeg";
          if (window.CATEGORY_IMAGES && window.CATEGORY_IMAGES[sec.title]) {
            imgPath = window.CATEGORY_IMAGES[sec.title];
          } else if (sec.options && sec.options.length > 0) {
            const firstProd = window.ALL_PRODUCTS.find(p => p.id === sec.options[0].productId);
            if (firstProd) {
              if (window.CATEGORY_IMAGES && window.CATEGORY_IMAGES[firstProd.category]) {
                imgPath = window.CATEGORY_IMAGES[firstProd.category];
              } else if (firstProd.image) {
                imgPath = firstProd.image;
              }
            }
          }

          btn.innerHTML = `
            <img src="${imgPath}" onerror="this.src='assets/images/dairy.jpeg'">
            <span>${sec.title}</span>
          `;
          btn.onclick = () => {
            document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            filterByRecipeSection(recipe, sec.title);
          };
          categoryScroll.appendChild(btn);
        });
      }

      // 🔥 DEFAULT TO "ALL" OR FIRST SECTION
      if (sectionTitle) {
        filterByRecipeSection(recipe, sectionTitle);
      } else if (recipe.sections && recipe.sections.length > 0) {
        // Default to "All" if sections exist
        filterByRecipeSection(recipe, "All");
        if (categoryScroll && categoryScroll.firstChild) categoryScroll.firstChild.classList.add("active");
      } else if (recipe.ingredients && recipe.ingredients.length > 0) {
        // Fallback for recipes without sections (like Italian)
        filterByRecipeSection(recipe, "All");
      }
    }
  } else if (type === "recipe" && cuisine) {
    title.innerText = `${cuisine} Recipes`;
    grid.className = "recipe-grid"; // Use the 7-column grid
    if (!window.ALL_RECIPES) {
      await fetchRecipes();
    }
    const matched = (window.ALL_RECIPES || []).filter(r =>
      r.cuisine && r.cuisine.toLowerCase() === cuisine.toLowerCase()
    );
    renderGrid(matched, "recipe");
  } else if (category) {
    const items = window.ALL_PRODUCTS.filter(p => p.category === category);
    title.innerText = `${category} (${items.length} items)`;
    renderGrid(items, "product");
  } else {
    title.innerText = "Category";
    grid.innerHTML = "<p style='padding:20px'>No category selected</p>";
    return;
  }

  async function fetchRecipes() {
    try {
      const response = await fetch('/api/recipes');
      window.ALL_RECIPES = await response.json();
    } catch (err) {
      console.error("Failed to load recipes in category.js", err);
      window.ALL_RECIPES = [];
    }
  }

  function filterByRecipeSection(recipe, sTitle) {
    if (sTitle === "All") {
      let productIds = [];
      if (recipe.sections && recipe.sections.length > 0) {
        recipe.sections.forEach(sec => {
          sec.options.forEach(opt => {
            if (opt.productId) productIds.push(opt.productId);
          });
        });
      } else if (recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          if (ing.productId) productIds.push(ing.productId);
        });
      }
      
      // Deduplicate IDs
      productIds = [...new Set(productIds)];
      
      const filtered = window.ALL_PRODUCTS.filter(p => productIds.includes(p.id));
      title.innerText = `${recipe.name} - All Ingredients (${filtered.length} items)`;
      renderGrid(filtered, "product");
    } else {
      const section = recipe.sections?.find(s => s.title === sTitle);
      if (section) {
        const productIds = section.options.map(opt => opt.productId).filter(id => id != null);
        const filtered = window.ALL_PRODUCTS.filter(p => productIds.includes(p.id));
        title.innerText = `${recipe.name} - ${sTitle} (${filtered.length} items)`;
        renderGrid(filtered, "product");
      }
    }
  }

  function renderGrid(items, itemType) {
    if (!items || !items.length) {
      grid.innerHTML = `<p style='padding:20px'>No ${itemType}s found</p>`;
      return;
    }

    const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};

    if (itemType === "product") {
      grid.innerHTML = items.map(p => {
        if (window.getProductCardHTML) {
          return window.getProductCardHTML(p, cart);
        } else {
          return `
            <div class="product-card">
              <div class="product-name">${p.name}</div>
              <div class="product-qty">${p.qty}</div>
              <div class="product-bottom">
                <div class="price">₹${p.price}</div>
                <div class="action-wrap" id="action-${p.id}">
                  <button class="add-btn" data-id="${p.id}">ADD</button>
                </div>
              </div>
            </div>`;
        }
      }).join("");
    } else {
      // Recipe cards matching tall "fruit card" style
      grid.innerHTML = items.map(r => `
        <div class="product-card recipe-result">
          <div class="product-img-wrap">
            <img src="${r.image || 'assets/images/placeholder.jpg'}" alt="${r.name}" onerror="this.src='assets/images/placeholder.jpg'">
          </div>
          <div class="product-name">${r.name}</div>
          <div class="product-bottom">
            <div class="action-wrap">
              <button class="add-btn" data-recipe-id="${r.id}" style="width: 100%; border: 1.5px solid #3b1a86; border-radius: 8px; font-weight: 600; padding: 8px;">
                Add ingredients
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }
  }
});
