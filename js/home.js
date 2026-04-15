/* =========================
   GLOBAL STATE
========================= */
let searchMode = "product";
window.SEARCH_INDEX = [];
let activeProductId = null; // 🔥 Track which product currently shows the quantity selector
let previousViewState = null; // 🔥 Track state before showing recipe ingredients


/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- HEADER USER ---------- */
  updateHeaderUser();

  /* ---------- CATEGORIES ---------- */
  initCategories();

  /* ---------- CLICK HANDLERS (Global) ---------- */
  initGlobalClicks();

  /* ---------- DATA CHECK ---------- */
  // TEMPORARY: Clear cart to show empty state as requested
  // localStorage.removeItem("grosyncCart"); 

  if (window.ALL_PRODUCTS && ALL_PRODUCTS.length) {
    /* ---------- SEARCH INDEX ---------- */
    window.updateSearchIndex();
  } else {
    console.log("ℹ️ Waiting for ALL_PRODUCTS to be fetched...");
  }

  // Avatar Click
  const avatar = document.getElementById("userAvatar");
  if (avatar) {
    avatar.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  /* ---------- UPDATE BADGE ---------- */
  updateCartBadge();

  /* ---------- SEARCH INIT ---------- */
  initSearch();

  /* ---------- FETCH RECIPES ---------- */
  fetchRecipes();

  /* ---------- SMART RECOMMENDATIONS ---------- */
  setTimeout(initSmartRecommendations, 1000);

  /* ---------- SCROLL RESET ---------- */
  window.scrollTo(0, 0);
});

async function fetchRecipes() {
  try {
    const response = await fetch('/api/recipes');
    window.ALL_RECIPES = await response.json();

  } catch (err) {
    console.error("Failed to load recipes:", err);
    window.ALL_RECIPES = [];
  }
}

/* =========================
   CATEGORY INIT
========================= */

/* =========================
   SEARCH INIT
========================= */
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchExecBtn = document.getElementById("searchExecBtn");
  const suggestionsBox = document.getElementById("searchSuggestions");

  if (!searchInput) return;

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      executeHomeSearch();
    }
  });

  if (searchExecBtn) {
    searchExecBtn.addEventListener("click", executeHomeSearch);
  }

  // Real-time suggestions
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query || query.length < 2) {
      if (suggestionsBox) suggestionsBox.classList.remove("show");
      return;
    }

    renderSuggestions(query, suggestionsBox);
  });

  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox?.contains(e.target)) {
      suggestionsBox?.classList.remove("show");
    }
  });
}

function renderSuggestions(query, box) {
  if (!box) return;

  let matches = [];
  const mode = window.searchMode || "product";

  if (mode === "product") {
    matches = (window.SEARCH_INDEX || []).filter(p => p.searchKey.includes(query)).slice(0, 6);
  } else {
    matches = (window.ALL_RECIPES || []).filter(r => 
      r.name.toLowerCase().includes(query) || 
      (r.cuisine && r.cuisine.toLowerCase().includes(query))
    ).slice(0, 6);
  }

  if (matches.length === 0) {
    box.classList.remove("show");
    return;
  }

  box.innerHTML = matches.map(m => {
    const icon = mode === "product" ? "ri-shopping-basket-line" : "ri-restaurant-line";
    const subText = mode === "product" ? m.category : m.cuisine;
    return `
      <div class="suggestion-item" onclick="handleSuggestionClick('${m.id}', '${m.name.replace(/'/g, "\\'")}', '${mode}')">
        <i class="${icon}"></i>
        <div class="suggestion-text">${m.name}</div>
        <div class="suggestion-category">${subText || ''}</div>
      </div>
    `;
  }).join("");

  box.classList.add("show");
}

window.handleSuggestionClick = function(id, name, mode) {
  window.location.href = `search.html?q=${encodeURIComponent(name)}&m=${mode}`;
};

function executeHomeSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim();
  const mode = searchMode || "product";
  
  if (query) {
    window.location.href = `search.html?q=${encodeURIComponent(query)}&m=${mode}`;
  }
}


// 🔥 EXPOSE for products-section.js
window.updateSearchIndex = function () {
  if (!window.ALL_PRODUCTS) return;

  // Global Sort
  window.ALL_PRODUCTS.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  window.SEARCH_INDEX = ALL_PRODUCTS.map(p => ({
    ...p,
    searchKey: p.name.toLowerCase()
  }));


  // 🔥 Restore categories once data is available
  if (typeof initCategories === "function") {
    initCategories();
  }

  // 🔥 Update "See All" counts
  updateSeeAllCounts();

  // Also try to init recommendations if data arrived late
  if (typeof initSmartRecommendations === "function") {
    initSmartRecommendations();
  }
};

function updateSeeAllCounts() {
  if (!window.ALL_PRODUCTS) return;

  document.querySelectorAll(".see-all").forEach(btn => {
    const category = btn.dataset.category;
    const cuisine = btn.dataset.cuisine;

    if (category) {
      const count = window.ALL_PRODUCTS.filter(p => p.category === category).length;
      btn.innerText = `see all (${count})`;
    } else if (cuisine && window.ALL_RECIPES) {
      const count = window.ALL_RECIPES.filter(r => r.cuisine && r.cuisine.toLowerCase() === cuisine.toLowerCase()).length;
      btn.innerText = `see all (${count})`;
    }
  });
}


window.setSearchMode = function(mode) {
  searchMode = mode;
  window.searchMode = mode; // Ensure global consistency
  const searchTypeBtn = document.getElementById("searchTypeBtn");
  const searchInput = document.getElementById("searchInput");

  if (!searchTypeBtn || !searchInput) return;

  if (mode === "product") {
    searchTypeBtn.innerText = "Products";
    searchInput.placeholder = "Search products";
    if (typeof renderProductCategories === "function") renderProductCategories();
  } else {
    searchTypeBtn.innerText = "Recipes";
    searchInput.placeholder = "Search recipes";
    if (typeof renderCuisineCategories === "function") renderCuisineCategories();
  }

  // If on search page, re-execute search with the new mode
  if (window.location.pathname.includes("search.html")) {
    const query = searchInput.value.trim();
    if (query && typeof performSearch === "function") {
      performSearch(query, mode);
    }
  } else {
    searchInput.value = "";
    if (typeof showHome === "function") showHome();
  }
};

/* =========================
   GLOBAL CLICK HANDLERS
========================= */
window.initGlobalClicks = initGlobalClicks;
function initGlobalClicks() {
  document.addEventListener("click", e => {

    /* ---- ADD TO CART (INITIAL) ---- */
    const addBtn = e.target.closest(".add-btn");
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (addBtn.dataset.recipeId) {
        // Redirect to category page for recipe ingredients (Route-based separation)
        window.location.href = `category.html?recipeId=${addBtn.dataset.recipeId}`;
      } else {
        checkLoginAndModifyCart(addBtn.dataset.id, 1);
      }
      return;
    }

    /* ---- PLUS BUTTON ---- */
    const plusBtn = e.target.closest(".qty-btn-plus");
    if (plusBtn) {
      e.preventDefault();
      e.stopPropagation();
      checkLoginAndModifyCart(plusBtn.dataset.id, 1);
      return;
    }

    /* ---- MINUS BUTTON ---- */
    const minusBtn = e.target.closest(".qty-btn-minus");
    if (minusBtn) {
      e.preventDefault();
      e.stopPropagation();
      checkLoginAndModifyCart(minusBtn.dataset.id, -1);
      return;
    }


    /* ---- SEE ALL ---- */
    const seeAll = e.target.closest(".see-all");
    if (seeAll) {
      if (seeAll.dataset.cuisine) {
        window.location.href = `category.html?type=recipe&cuisine=${encodeURIComponent(seeAll.dataset.cuisine)}`;
      } else {
        window.location.href =
          `category.html?category=${encodeURIComponent(seeAll.dataset.category)}`;
      }
    }
  });
}

/* =========================
   UI HELPERS
========================= */
function hideHome(keepCategories = false) {
  const selectors = [".hero-banner", ".product-section"];
  if (!keepCategories) selectors.push(".categories-section");

  document.querySelectorAll(selectors.join(", "))
    .forEach(el => el.classList.add("hidden"));
}

function showHome() {
  document.querySelectorAll(
    ".hero-banner, .categories-section, .product-section"
  ).forEach(el => {
    // For specific IDs, check additional conditions
    if (el.id === "reorderSection") {
      if (el.dataset.hasItems === "true") {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
      return;
    }

    if (el.id === "homeRecipeSections") {
      // Never show on home page as per user request
      el.classList.add("hidden");
      return;
    }

    // All other sections (including product sections with data-section) should stay
    el.classList.remove("hidden");
  });
}

function initSmartRecommendations() {
  if (typeof getSmartRecommendations !== "function") return;

  const recommendations = getSmartRecommendations();
  const section = document.getElementById("reorderSection");
  const row = document.getElementById("reorderRow");

  if (recommendations && recommendations.length > 0 && section && row) {
    section.classList.remove("hidden");
    section.dataset.hasItems = "true";
    row.innerHTML = "";

    const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};

    recommendations.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      const qtyInCart = cart[p.id] || 0;
      let buttonHTML = qtyInCart > 0 ? `
        <div class="qty-control">
          <button class="qty-btn-minus" data-id="${p.id}">−</button>
          <span class="qty-val">${qtyInCart}</span>
          <button class="qty-btn-plus" data-id="${p.id}">+</button>
        </div>
      ` : `<button class="add-btn" data-id="${p.id}">ADD</button>`;

      const labelColor = p.exhaustDays < 0 ? "#e74c3c" : "#f39c12";
      const labelText = p.exhaustDays < 0 ? "Exhausted!" : `Finish in ${p.exhaustDays} days`;


      card.innerHTML = `
        <div class="delivery-time" style="background: ${labelColor}; color: white;">${labelText}</div>
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/images/placeholder.jpg'">
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-qty">${p.qty}</div>

        <div class="product-bottom">
          <div class="price">₹${p.price}</div>
          <div class="action-wrap" id="action-${p.id}">
             ${buttonHTML}
          </div>
        </div>
      `;
      row.appendChild(card);
    });
  }
}

/* =========================
   HEADER USER
========================= */
function updateHeaderUser() {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  const authBtn = document.getElementById("authBtn");
  const avatar = document.getElementById("userAvatar");

  if (!authBtn || !avatar) return;

  if (user) {
    authBtn.style.display = "none";
    avatar.style.display = "flex";
    updateDropdownInfo(user);
    // Show both initials if available
    const names = user.name.trim().split(" ");
    const initials = names.length > 1
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : names[0][0].toUpperCase();
    avatar.textContent = initials;

    // Also hide Join Group controls if already in a group
    const savedCode = localStorage.getItem("grosyncGroupCode");
    const joinWrap = document.querySelector(".join-group-wrap");
    if (savedCode && joinWrap) {
      joinWrap.style.display = "none";
    } else if (joinWrap) {
      joinWrap.style.display = "flex";
    }

  } else {
    authBtn.style.display = "block";
    avatar.style.display = "none";
    // Show join wrap if logged out (usually)
    const joinWrap = document.querySelector(".join-group-wrap");
    if (joinWrap) joinWrap.style.display = "flex";
  }
}

/* =========================
   USER DROPDOWN LOGIC
========================= */
window.toggleUserDropdown = function (e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("userDropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
};

// Update dropdown with user name
function updateDropdownInfo(user) {
  const nameEl = document.getElementById("dropdownUserName");
  if (nameEl && user) {
    nameEl.textContent = user.name;
  }
}


window.logoutUser = async function () {
  if (confirm("Are you sure you want to log out?")) {
    const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
    if (Object.keys(cart).length > 0) {
      console.log("Syncing cart before logout...");
      await syncCartToDB(cart);
    }
    localStorage.clear();
    location.reload();
  }
};

/* =========================
   HEADER ACTIONS
========================= */
document.getElementById("authBtn")?.addEventListener("click", () => {
  window.location.href = "login.html";
});


const searchTypeBtn = document.getElementById("searchTypeBtn");
const searchDropdown = document.getElementById("searchDropdown");

if (searchTypeBtn && searchDropdown) {
  searchTypeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    searchDropdown.classList.toggle("show");
  });
}

// close dropdowns when clicking outside
document.addEventListener("click", () => {
  const userDropdown = document.getElementById("userDropdown");
  const searchDropdown = document.getElementById("searchDropdown");
  if (userDropdown) userDropdown.classList.remove("show");
  if (searchDropdown) searchDropdown.classList.remove("show");
});
function setSearchMode(mode) {
  searchMode = mode;

  const searchTypeBtn = document.getElementById("searchTypeBtn");
  const searchInput = document.getElementById("searchInput");

  if (mode === "product") {
    searchTypeBtn.innerText = "Products";
    searchInput.placeholder = "Search products";
    // Show product sections
    document.querySelectorAll(".product-section[data-section]").forEach(s => s.classList.remove("hidden"));
    const recipeContainer = document.getElementById("homeRecipeSections");
    if (recipeContainer) recipeContainer.classList.add("hidden");
    renderProductCategories();
  } else {
    searchTypeBtn.innerText = "Recipes";
    searchInput.placeholder = "Search recipes";

    // 🔥 Keep product sections visible as per user request: "remove only recipes not produtc from hompage"
    // document.querySelectorAll(".product-section[data-section]").forEach(s => s.classList.add("hidden")); // REMOVED

    // Hide recipe rows if they were rendered on home
    const recipeContainer = document.getElementById("homeRecipeSections");
    if (recipeContainer) recipeContainer.classList.add("hidden");

    renderCuisineCategories();
  }

  searchInput.value = "";
  showHome();
}

function renderHomeRecipeSections() {
  const recipes = window.ALL_RECIPES || [];
  let recipeContainer = document.getElementById("homeRecipeSections");
  if (!recipeContainer) {
    recipeContainer = document.createElement("div");
    recipeContainer.id = "homeRecipeSections";
    const catSection = document.querySelector(".categories-section");
    if (catSection) catSection.parentNode.insertBefore(recipeContainer, catSection.nextSibling);
  }
  recipeContainer.classList.remove("hidden");
  recipeContainer.innerHTML = "";

  if (recipes.length === 0) {
    recipeContainer.innerHTML = "<p style='padding:20px'>Loading recipes...</p>";
    return;
  }

  // Group by cuisine
  const groups = recipes.reduce((acc, r) => {
    const c = r.cuisine || "Other";
    if (!acc[c]) acc[c] = [];
    acc[c].push(r);
    return acc;
  }, {});

  Object.entries(groups).forEach(([cuisine, recs]) => {
    const section = document.createElement("section");
    section.className = "product-section";
    section.innerHTML = `
      <div class="section-header">
        <h2>${cuisine} Recipes</h2>
        <span class="see-all" data-cuisine="${cuisine}">see all</span>
      </div>
      <div class="recipe-grid">
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
    recipeContainer.appendChild(section);
  });
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  let totalItems = 0;
  let hasGhostKeys = false;

  Object.keys(cart).forEach(id => {
    if (!id || id === "undefined" || id === "null" || id === "[object Object]") {
      delete cart[id];
      hasGhostKeys = true;
    } else {
      const qty = Number(cart[id]);
      if (isNaN(qty) || qty <= 0) {
        delete cart[id];
        hasGhostKeys = true;
      } else {
        totalItems += qty;
      }
    }
  });

  if (hasGhostKeys) {
    if (Object.keys(cart).length === 0) {
      localStorage.removeItem("grosyncCart");
    } else {
      localStorage.setItem("grosyncCart", JSON.stringify(cart));
    }
  }

  if (totalItems <= 0) {
    badge.innerText = "0";
    badge.style.display = "none";
  } else {
    badge.innerText = totalItems;
    badge.style.display = "flex";
  }
}





function addRecipeToCart(recipeId) {
  recipeId = Number(recipeId);

  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    localStorage.setItem("redirectAfterLogin", "home.html");
    window.location.href = "login.html";
    return;
  }

  const recipe = (window.ALL_RECIPES || []).find(r => r.id === recipeId);
  if (!recipe) return;

  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  let itemsToAdd = [];

  if (recipe.sections && recipe.sections.length > 0) {
    // If it has sections, add the first option of each section as default
    recipe.sections.forEach(sec => {
      if (sec.options && sec.options.length > 0) {
        itemsToAdd.push({ productId: sec.options[0].productId, qty: 1 });
      }
    });
  } else if (recipe.ingredients && recipe.ingredients.length > 0) {
    itemsToAdd = recipe.ingredients;
  } else {
    alert("This recipe has no ingredients defined.");
    return;
  }

  itemsToAdd.forEach(item => {
    cart[item.productId] = (cart[item.productId] || 0) + (item.qty || 1);
  });

  localStorage.setItem("grosyncCart", JSON.stringify(cart));
  updateCartBadge();
  if (window.syncCartToDB) syncCartToDB(cart);

  // Update UI buttons if any products are visible
  itemsToAdd.forEach(item => {
    if (window.updateProductCardButton) {
      updateProductCardButton(item.productId, cart[item.productId]);
    }
  });

  alert(`Ingredients for "${recipe.name}" added to cart!`);
}

// Make sure this is globally available or properly scoped if called from console
window.updateProductCardButton = function (id, qty) {
  const wrappers = document.querySelectorAll(`#action-${id}`);
  wrappers.forEach(wrap => {
    if (qty > 0) {
      const existingQtyVal = wrap.querySelector('.qty-val');
      if (existingQtyVal) {
        // Just update the number if the control is already rendered!
        existingQtyVal.innerText = qty;
      } else {
        // Initial transition from ADD button to qty controls
        wrap.innerHTML = `
                <div class="qty-control">
                    <button class="qty-btn-minus" data-id="${id}">−</button>
                    <span class="qty-val">${qty}</span>
                    <button class="qty-btn-plus" data-id="${id}">+</button>
                </div>
            `;
      }
    } else {
      wrap.innerHTML = `<button class="add-btn" data-id="${id}">ADD</button>`;
    }
  });
};


function checkLoginAndModifyCart(id, change) {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    localStorage.setItem("redirectAfterLogin", "home.html");
    window.location.href = "login.html";
    return;
  }

  modifyCart(id, change);
}

function modifyCart(id, change) {
  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  const currentQty = cart[id] || 0;
  const newQty = currentQty + change;

  // Check max limit
  if (newQty > 12) {
    alert("Maximum quantity limit is 12");
    return;
  }

  cart[id] = newQty;

  if (cart[id] <= 0) {
    delete cart[id];
  }


  localStorage.setItem("grosyncCart", JSON.stringify(cart));
  updateCartBadge();
  updateProductCardButton(id, cart[id] || 0);

  // Sync to DB
  syncCartToDB(cart);
}

// Make available globally
window.syncCartToDB = syncCartToDB;

async function syncCartToDB(cart) {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) return;

  // Convert {id: qty} to [{ productId, name, price, ... }]
  // We need window.ALL_PRODUCTS to be loaded
  if (!window.ALL_PRODUCTS) return;

  const cartArray = Object.keys(cart).map(id => {
    const qty = cart[id];
    if (!qty || qty < 1) return null; // Filter invalid quantities

    const product = window.ALL_PRODUCTS.find(p => p.id == id);
    if (!product) return null;

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qtyLabel: product.qty,
      quantity: qty
    };
  }).filter(item => item !== null);

  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        savedCart: cartArray
      })
    });
  } catch (err) {
    console.error("Cart sync failed:", err);
  }
}

function searchRecipe() {
  const query = document.getElementById("recipeSearch").value.toLowerCase();
  const container = document.getElementById("recipeResults");

  container.innerHTML = "";
  if (!query) return;

  const results = window.ALL_RECIPES.filter(r =>
    r.name.toLowerCase().includes(query)
  );

  results.forEach(recipe => {
    container.innerHTML += renderRecipeCard(recipe);
  });
}

function renderRecipeCard(recipe) {
  const ingredientsHTML = recipe.ingredients
    .map(item => {
      const product = window.ALL_PRODUCTS.find(
        p => p.id === item.productId
      );
      return product ? `<li>${product.name}</li>` : "";
    })
    .join("");

  return `
    <div class="recipe-card">
      <h3>${recipe.name}</h3>

      <p class="ingredient-count">
        ${recipe.ingredients.length} ingredients
      </p>

      <ul class="ingredient-list">
        ${ingredientsHTML}
      </ul>

      <button class="add-btn">Add ingredients</button>
    </div>
  `;
}
const CUISINES = [
  { name: "North Indian", image: "assets/images/recipes/dal_baati_churma.png" },
  { name: "South Indian", image: "assets/images/recipes/masala_dosa.png" },
  { name: "Gujarati", image: "assets/images/recipes/ker_sangri.png" }, // Placeholder for now
  { name: "Punjabi", image: "assets/images/recipes/paneer_butter_masala.png" },
  { name: "Italian", image: "assets/images/recipes/italian.png" }
];
function initCategories() {
  if (searchMode === "product") {
    renderProductCategories();
  } else {
    renderCuisineCategories();
  }
}




function renderProductCategories() {
  const categoryScroll = document.getElementById("categoryScroll");
  if (!categoryScroll) return;

  categoryScroll.innerHTML = "";

  // Get categories in specified order from constants.js
  const uniqueCategories = window.CATEGORY_ORDER || [];

  // Mapping of category names to images (source of truth from data.js)
  const categoryImages = window.CATEGORY_IMAGES || {};

  uniqueCategories.forEach(catName => {
    const btn = document.createElement("button");
    btn.className = "category-btn";

    // Find an image for this category
    let imgPath = categoryImages[catName];
    if (!imgPath) {
      const firstProd = (window.ALL_PRODUCTS || []).find(p => p.category === catName);
      imgPath = firstProd ? firstProd.image : "assets/images/default.jpg";
    }

    btn.innerHTML = `
      <img src="${imgPath}" onerror="this.src='assets/images/default.jpg'">
      <span>${catName}</span>
    `;
    btn.onclick = () => {
      const section = document.querySelector(`.product-section[data-section="${catName}"]`);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      } else {
        // If section doesn't exist yet, render it or filter the main view
        console.log("Section for " + catName + " not found");
      }
    };
    categoryScroll.appendChild(btn);
  });
}

function renderCuisineCategories() {
  const categoryScroll = document.getElementById("categoryScroll");
  if (!categoryScroll) return;

  categoryScroll.innerHTML = "";

  CUISINES.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.innerHTML = `
      <img src="${c.image}" onerror="this.src='assets/images/default.jpg'">
      <span>${c.name}</span>
    `;
    btn.onclick = () => {
      window.location.href = `category.html?type=recipe&cuisine=${encodeURIComponent(c.name)}`;
    };
    categoryScroll.appendChild(btn);
  });
}

function renderRecipeSectionsAsCategories(recipe) {
  const categoryScroll = document.getElementById("categoryScroll");
  if (!categoryScroll) return;

  categoryScroll.innerHTML = "";

  const sections = recipe.sections || [];
  sections.forEach(sec => {
    const btn = document.createElement("button");
    btn.className = "category-btn";

    // Find first product for image
    let imgPath = "assets/images/default.jpg";
    if (sec.options && sec.options.length > 0) {
      const firstProd = window.ALL_PRODUCTS.find(p => p.id === sec.options[0].productId);
      if (firstProd) imgPath = firstProd.image;
    }

    btn.innerHTML = `
      <img src="${imgPath}" onerror="this.src='assets/images/default.jpg'">
      <span>${sec.title}</span>
    `;
    btn.onclick = () => {
      const row = document.getElementById(`row-${sec.title.replace(/\s+/g, '-')}`);
      if (row) {
        row.parentElement.scrollIntoView({ behavior: "smooth" });
      }
    };
    categoryScroll.appendChild(btn);
  });
}




/* =========================
   GROUP BUY (COLLABORATIVE)
========================= */
let activeGroup = null;

function openJoinModal() {
  const code = document.getElementById("joinCodeInput").value.trim().toUpperCase();
  if (!code) return alert("Please enter an invite code first!");

  document.getElementById("joinModal").classList.add("active");
  document.getElementById("modalOverlay").classList.add("active");
}

function closeJoinModal() {
  document.getElementById("joinModal").classList.remove("active");
  document.getElementById("modalOverlay").classList.remove("active");
}

async function confirmJoinGroup() {
  const code = document.getElementById("joinCodeInput").value.trim().toUpperCase();
  const name = document.getElementById("joinName").value.trim();

  const houseNo = document.getElementById("joinHouse").value.trim();
  const area = document.getElementById("joinArea").value.trim();
  const pincode = document.getElementById("joinPincode").value.trim();
  const city = document.getElementById("joinCity").value.trim();
  const phone = document.getElementById("joinPhone").value.trim();

  if (!name || !houseNo || !area || !pincode || !city || !phone) return alert("Please fill all details");

  const loggedUser = JSON.parse(localStorage.getItem("grosyncLoggedUser")) || {};

  const memberInfo = {
    name,
    phone,
    fullName: name,
    houseNo,
    area,
    pincode,
    city,
    state: "Andhra Pradesh",
    country: "India",
    email: loggedUser.email || ""
  };

  try {
    const res = await fetch('/api/groupbuy/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode: code,
        memberInfo
      })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    // Save active group to local storage
    localStorage.setItem("grosyncGroupCode", code);
    localStorage.setItem("grosyncGroupMember", JSON.stringify(memberInfo));

    activeGroup = data;
    closeJoinModal();
    alert("Joined group successfully! Add items to your cart to contribute.");

    // Hide the join controls in header
    const joinWrap = document.querySelector(".join-group-wrap");
    if (joinWrap) joinWrap.style.display = "none";

    startGroupPolling(code);
    showDashboard();

  } catch (err) {
    alert(err.message);
  }
}

function toggleDashboard() {
  const dash = document.getElementById("groupDashboard");
  dash.style.display = dash.style.display === "none" ? "flex" : "none";
}

function showDashboard() {
  document.getElementById("groupDashboard").style.display = "flex";
}

function startGroupPolling(code) {
  updateGroupDashboard(code);
  setInterval(() => updateGroupDashboard(code), 5000); // Poll every 5s
}

async function updateGroupDashboard(code) {
  if (!code) return;
  try {
    const res = await fetch(`/api/groupbuy/${code}`);
    if (!res.ok) return;
    const group = await res.json();
    activeGroup = group;

    document.getElementById("dashInviteCode").innerText = code;
    document.getElementById("groupStatusInfo").innerText = `Members: ${group.members.length}/5`;

    const list = document.getElementById("memberList");
    if (list) {
      const currentMember = JSON.parse(localStorage.getItem("grosyncGroupMember"));
      list.innerHTML = group.members.map(m => `
        <div class="member-item ${m.isDone ? 'done' : ''}">
          <div class="member-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div class="member-info">
              <span class="member-name" style="font-weight: 600; font-size: 13px;">${m.name} ${m.isLeader ? '<small style="color: #6c5ce7;">(Leader)</small>' : ''}</span>
              <span class="member-status" style="display: block; font-size: 11px; color: ${m.isDone ? '#27ae60' : '#888'};">
                ${m.isDone ? 'Ready' : 'Shopping...'}
              </span>
            </div>
          </div>
          <div class="member-cart-preview" style="background: #fdfdfd; border: 1px solid #eee; border-radius: 6px; padding: 6px; font-size: 11px;">
            ${(m.cart || []).length > 0 ? m.cart.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>${item.name} x${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
              </div>
            `).join("") : '<p style="color: #aaa; font-style: italic; margin: 0;">No items yet</p>'}
          </div>
        </div>
      `).join("");
    }

  } catch (err) {
    console.warn("Poll error", err);
  }
}

// On page load, check if user is already in a group
document.addEventListener("DOMContentLoaded", () => {
  const savedCode = localStorage.getItem("grosyncGroupCode");
  if (savedCode) {
    startGroupPolling(savedCode);
    showDashboard();
  }
});
