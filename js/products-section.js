document.addEventListener("DOMContentLoaded", async () => {

  // 🔥 GLOBAL CARD GENERATOR


  window.getProductCardHTML = function (p, cart = {}) {
    const isOutOfStock = p.stock === 0;
    const isLowStock = p.stock > 0 && p.stock <= 10;
    const pid = p.id || p._id;
    const qtyInCart = cart[pid] || cart[String(pid)] || 0;

    let buttonHTML = '';
    if (isOutOfStock) {
      buttonHTML = `<button class="add-btn disabled" disabled>Out of Stock</button>`;
    } else {
      buttonHTML = `<button class="add-btn" data-id="${pid}">ADD</button>`;
    }

    const stockBadge = isLowStock ? `<div class="low-stock-badge" style="font-size: 11px; color: #ff4d4d; font-weight: 600; margin-top: 4px;">Only ${p.stock} left</div>` : '';
    const oosOverlay = isOutOfStock ? `<div class="oos-overlay">Out of Stock</div>` : '';

    return `
      <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
        <div class="delivery-time">⏱️ 15 MINS</div>
        <div class="product-img-wrap">
          <img src="${p.image || 'assets/images/placeholder.jpg'}" alt="${p.name}" loading="lazy" decoding="async">
          ${oosOverlay}
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-qty">${p.qty}</div>

        ${stockBadge}
        <div class="product-bottom">
          <div class="price">₹${p.price}</div>
          <div class="action-wrap" id="action-${pid}">
             ${buttonHTML}
          </div>
        </div>
      </div>
    `;
  };

  window.renderRow = function (category, rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    if (!window.ALL_PRODUCTS) return;

    const items = ALL_PRODUCTS.filter(p => p.category === category);
    row.innerHTML = "";
    if (!items.length) return;

    const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
    const html = items.map(p => window.getProductCardHTML(p, cart)).join("");
    row.innerHTML = html;
  };

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    window.ALL_PRODUCTS = await res.json();

    // 🔥 Update Search Index (home.js depends on this)
    if (window.updateSearchIndex) window.updateSearchIndex();

    // 🔥 FORCE SYNC: Ensure DB matches Local Cart (Fixes mismatch issues)
    const currentCart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
    if (Object.keys(currentCart).length > 0 && window.syncCartToDB) {

      window.syncCartToDB(currentCart);
    }

    // 🔥 CALL ALL SECTIONS (Optimized with requestIdleCallback for better performance)
    // 🔥 Map category order to section IDs from constants.js
    const categoryToId = {
      "Fruits": "fruitRow",
      "Vegetables": "vegetableRow",
      "Dairy Products": "dairyRow",
      "Atta, Rice & Dal": "cookingRow",
      "Oil, Ghee & Masala": "oilgheemasalaRow",
      "Daily Essentials": "dailyRow",
      "Bath & Body": "bathRow",
      "Feminine Hygiene": "feminineRow",
      "Baby Care": "babyRow",
      "Chips & Namkeen": "chipsRow",
      "Biscuits & Bakery": "biscuitssRow",
      "Instant Food": "instantRow",
      "Sauces": "saucesRow",
      "Dryfruit & Cereals": "dryfruitRow",
      "Sweets & Chocolates": "sweetsRow",
      "Drinks & Beverages": "drinksRow",
      "Stationery": "statRow"
    };

    const sections = (window.CATEGORY_ORDER || []).map(cat => [cat, categoryToId[cat]]);


    // 🔥 Render all sections instantly to avoid "counting" effect
    sections.forEach(([category, rowId]) => {
      renderRow(category, rowId);
    });

  } catch (err) {
    console.error("Error loading products:", err);

    const rows = document.querySelectorAll('.product-row');
    rows.forEach(row => {
      row.innerHTML = `<div class="error-msg" style="text-align:center; width:100%; color:red; padding:20px;">Server Error: ${err.message}</div>`;
    });
  }

});
