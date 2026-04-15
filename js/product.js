document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    window.PRODUCTS = await res.json();
  } catch (err) {
    console.error("Error loading products:", err);
    return;
  }

  const id = new URLSearchParams(window.location.search).get("id");
  const p = PRODUCTS.find(x => x._id === id || x.id == id);
  if (!p) return;

  const nameEl = document.getElementById("name") || (typeof name !== 'undefined' ? name : null);
  const imgEl = document.getElementById("img") || (typeof img !== 'undefined' ? img : null);
  const ingEl = document.getElementById("ing") || (typeof ing !== 'undefined' ? ing : null);
  const weightEl = document.getElementById("weight") || (typeof weight !== 'undefined' ? weight : null);

  if (nameEl) nameEl.innerText = p.name;
  if (imgEl) imgEl.src = p.image;

  if (ingEl) ingEl.innerText = "Ingredients: " + (p.ingredients || "");

  if (p.weights && weightEl) {
    p.weights.forEach(w => {
      weightEl.innerHTML += `<option>${w}</option>`;
    });
  }
});

function addToCart() {
  const id = new URLSearchParams(window.location.search).get("id");
  const p = (window.PRODUCTS || []).find(x => x._id === id || x.id == id);
  if (!p) return;

  let cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  cart[p.id] = (cart[p.id] || 0) + 1;
  localStorage.setItem("grosyncCart", JSON.stringify(cart));
  alert("Added to cart");
}

function groupBuy() {
  addToCart();
  window.location.href = `cart.html`;
}
