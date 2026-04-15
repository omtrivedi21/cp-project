document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsDiv = document.getElementById("cartItems");
  const cartSummaryDiv = document.querySelector(".cart-summary");

  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  let totalItemsInCart = 0;
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
        totalItemsInCart += qty;
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

  if (totalItemsInCart <= 0) {
    if (cartSummaryDiv) cartSummaryDiv.style.display = "none";
    renderEmptyCart();
    return;
  }

  // Show loading state
  cartItemsDiv.innerHTML = `<div class="loading-msg" style="padding:40px; text-align:center; color:#666;">
    <i class="ri-loader-4-line ri-spin" style="font-size:30px; display:block; margin-bottom:10px;"></i>
    Loading your cart...
  </div>`;

  let products = [];
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      products = await res.json();
      window.ALL_PRODUCTS = products; // Keep global for other functions
    } else {
      throw new Error("Failed to fetch products from server");
    }
  } catch (err) {
    console.error("API fetch failed:", err);
    products = [];
  }

  if (!products.length) {
    cartItemsDiv.innerHTML = `<div class="error-msg" style="padding:20px; color:red; text-align:center;">
      Failed to load product information. Please try again later.
    </div>`;
    return;
  }

  let itemTotal = 0;
  cartItemsDiv.innerHTML = "";

  Object.keys(cart).forEach(id => {
    // Try both numeric and string comparison
    const product = products.find(p => p.id == id || p._id == id);
    if (!product) {
      console.warn(`Product with ID ${id} not found`);
      return;
    }

    const qty = parseInt(cart[id]);
    if (!qty || qty < 1) return;

    const price = product.price * qty;
    itemTotal += price;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-item-img">
        <img src="${product.image || 'assets/images/placeholder.jpg'}" alt="${product.name}">
      </div>
      <div class="cart-info">
        <h4>${product.name}</h4>
        <p>${product.qty}</p>
        <strong>₹${product.price}</strong>
      </div>

      <div class="cart-controls">
        <button class="qty-btn" onclick="updateQty('${id}', -1)">−</button>
        <span>${qty}</span>
        <button class="qty-btn" onclick="updateQty('${id}', 1)">+</button>
      </div>
      
      <div class="cart-item-total">
        ₹${price}
      </div>
    `;

    cartItemsDiv.appendChild(div);
  });

  const uniqueItemCount = Object.keys(cart).length;
  const co2Saved = 60 + (uniqueItemCount * 20);

  // --- BILL DETAILS ---
  let deliveryCharge = itemTotal >= 199 ? 0 : 30;
  let handlingCharge = 9;
  let smallCartCharge = itemTotal < 99 ? 20 : 0;
  let ecoDiscount = 2; // Default site-wide eco discount

  let grandTotal = itemTotal + deliveryCharge + handlingCharge + smallCartCharge - ecoDiscount;
  let groupDiscount = 0;
  let discountPercent = 0;

  // Collaborative Group Buy Discount
  const groupCodeForDiscount = localStorage.getItem("grosyncGroupCode");
  if (groupCodeForDiscount) {
    try {
      const groupRes = await fetch(`/api/groupbuy/${groupCodeForDiscount}`);
      const groupData = await groupRes.json();
      if (groupData && groupData.members) {
        let globalItemTotal = 0;
        groupData.members.forEach(m => {
          (m.cart || []).forEach(i => {
            globalItemTotal += i.price * (i.qty || i.quantity || 1);
          });
        });
        itemTotal = globalItemTotal;

        // Recalculate fees with new total
        deliveryCharge = itemTotal >= 199 ? 0 : 30;
        smallCartCharge = itemTotal < 99 ? 20 : 0;
        grandTotal = itemTotal + deliveryCharge + handlingCharge + smallCartCharge - ecoDiscount;

        const count = groupData.members.length;
        if (count >= 2) discountPercent = 10;

        if (discountPercent > 0) {
          groupDiscount = Math.round(itemTotal * (discountPercent / 100));
          grandTotal -= groupDiscount;
        }
      }
    } catch (e) { }
  }

  // Render Bill Details
  const billContainer = document.getElementById("billDetailsContainer");
  if (billContainer) {
    if (cartSummaryDiv) cartSummaryDiv.style.display = "block";

    billContainer.innerHTML = `
      <div class="eco-benefit-card">
        <div class="eco-header">
          <i class="ri-leaf-fill"></i>
          <span>Eco-Friendly Delivery</span>
        </div>
        <p>This order saves approx. <b>${co2Saved}g</b> of CO2 emissions.</p>
      </div>

      <div class="bill-details">
        <h3>Bill Details</h3>
        <div class="bill-row">
          <span>Items total</span>
          <span>₹${itemTotal}</span>
        </div>
        ${groupDiscount > 0 ? `
        <div class="bill-row" style="color: #27ae60; font-weight: 600;">
          <span>Group Discount (${discountPercent}%)</span>
          <span>-₹${groupDiscount}</span>
        </div>` : ''}
        <div class="bill-row eco-discount-row">
          <span>Eco Reward (Site-wide)</span>
          <span>-₹${ecoDiscount}</span>
        </div>
        <div class="bill-row" style="margin-bottom: 2px;">
          <span>Delivery charge <i class="ri-information-line"></i></span>
          <span>${deliveryCharge === 0 ? '<span style="color:#27ae60; font-weight:600;">FREE</span>' : '₹' + deliveryCharge}</span>
        </div>
        <div class="bill-row sub-row">
          <span>(Free above ₹199)</span>
        </div>
        <div class="bill-row">
          <span>Handling charge <i class="ri-information-line"></i></span>
          <span>₹${handlingCharge}</span>
        </div>
        <div class="bill-row" style="margin-bottom: 2px;">
          <span>Small cart charge <i class="ri-information-line"></i></span>
          <span>${smallCartCharge === 0 ? '<span style="color:#27ae60; font-weight:600;">FREE</span>' : '₹' + smallCartCharge}</span>
        </div>
        <div class="bill-row sub-row">
          <span>(Free above ₹99)</span>
        </div>
        
        <div class="bill-row grand-total">
          <span>Grand Total</span>
          <span>₹${grandTotal}</span>
        </div>
      </div>
    `;
  }

  /* ---------- CHECKOUT LOGIC ---------- */
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      localStorage.setItem("grosyncCartTotal", grandTotal);
      window.location.href = "checkout.html";
    });
  }

  // Initial group sync if in group
  const groupCode = localStorage.getItem("grosyncGroupCode");
  if (groupCode) {
    syncCartToGroup(groupCode, cart);
    initCartGroupDashboard(groupCode);

    // Show cancellation warning
    const notice = document.getElementById("groupBuyNotice");
    if (notice) notice.style.display = "block";
  }
});

/* =====================
   GROUP BUY LOGIC
===================== */
async function startCollaborativeGroup() {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    alert("Please log in to start a Group Buy!");
    window.location.href = "login.html";
    return;
  }

  // Construct leader info and cart
  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  const cartArray = convertCartToSyncArray(cart);

  const savedAddress = JSON.parse(localStorage.getItem("grosyncAddresses"))?.[0] || {};

  let leaderPhone = user.phone || user.mobile || savedAddress.mobile;

  if (!leaderPhone) {
    const manualPhone = prompt("Enter your 10-digit mobile number to start the Group Buy:");
    if (!manualPhone || manualPhone.length < 10) {
      alert("A valid 10-digit mobile number is required!");
      return;
    }
    leaderPhone = manualPhone;

    // Save to session for next time
    user.phone = leaderPhone;
    localStorage.setItem("grosyncLoggedUser", JSON.stringify(user));
  }

  const leaderInfo = {
    name: user.name || "User",
    phone: leaderPhone,
    fullName: savedAddress.fullName || user.name || "User",
    mobile: leaderPhone,
    pincode: savedAddress.pincode || "000000",
    houseNo: savedAddress.houseNo || "",
    area: savedAddress.area || "",
    landmark: savedAddress.landmark || "",
    city: savedAddress.city || "City",
    state: savedAddress.state || "State",
    country: savedAddress.country || 'India'
  };

  try {
    console.log("Creating group with body:", JSON.stringify({
      leaderEmail: user.email || "",
      leaderPhone: leaderInfo.phone,
      leaderInfo,
      leaderCart: cartArray
    }, null, 2));

    const res = await fetch('/api/groupbuy/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leaderEmail: user.email || "",
        leaderPhone: leaderInfo.phone,
        leaderInfo,
        leaderCart: cartArray
      })
    });

    const data = await res.json();
    console.log("Server Response:", data);

    if (!res.ok) {
      const errorMsg = data.details || data.error || "Unknown server error";
      throw new Error(errorMsg);
    }

    localStorage.setItem("grosyncGroupCode", data.inviteCode);
    localStorage.setItem("grosyncGroupMember", JSON.stringify(data.members[0])); // Use the member object returned by server

    alert(`Group created! Invite Code: ${data.inviteCode}\nShare this with your neighbors!`);
    location.reload();

  } catch (err) {
    console.error("Critical Start Group Error:", err);
    alert("Failed to start group: " + err.message);
  }
}

async function joinGroup() {
  const code = document.getElementById("joinGroupCode").value.toUpperCase();
  if (!code) return alert("Please enter an invite code");

  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    alert("Please log in to join a Group Buy!");
    window.location.href = "login.html";
    return;
  }

  let memberPhone = user.mobile || user.phone || savedAddress.mobile;

  if (!memberPhone) {
    const manualPhone = prompt("Enter your 10-digit mobile number to join the Group Buy:");
    if (!manualPhone || manualPhone.length < 10) {
      alert("A valid 10-digit mobile number is required!");
      return;
    }
    memberPhone = manualPhone;

    // Save to session
    user.phone = memberPhone;
    localStorage.setItem("grosyncLoggedUser", JSON.stringify(user));
  }

  const memberInfo = {
    name: user.name || "User",
    phone: memberPhone,
    fullName: savedAddress.fullName || user.name || "User",
    mobile: memberPhone,
    pincode: savedAddress.pincode || "000000",
    houseNo: savedAddress.houseNo || "",
    area: savedAddress.area || "",
    landmark: savedAddress.landmark || "",
    city: savedAddress.city || "City",
    state: savedAddress.state || "State",
    country: savedAddress.country || 'India',
    email: user.email || ""
  };

  try {
    const res = await fetch('/api/groupbuy/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code, memberInfo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to join group");

    localStorage.setItem("grosyncGroupCode", data.inviteCode);
    // Ensure we pick the member object that was just added (the last one)
    const me = data.members[data.members.length - 1];
    localStorage.setItem("grosyncGroupMember", JSON.stringify(me));

    alert("Joined Group Successfully!");
    location.reload();
  } catch (err) {
    alert(err.message);
  }
}

async function syncCartToGroup(code, cart) {
  const member = JSON.parse(localStorage.getItem("grosyncGroupMember"));
  if (!member) return;

  const cartArray = convertCartToSyncArray(cart);

  try {
    await fetch('/api/groupbuy/update-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode: code,
        phone: member.phone,
        email: member.email,
        name: member.name,
        cart: cartArray
      })
    });
  } catch (err) {
    console.warn("Cart group sync failed");
  }
}

function convertCartToSyncArray(cart) {
  const products = window.ALL_PRODUCTS || [];
  return Object.keys(cart).map(id => {
    const qty = cart[id];
    // id is the key (productId), value is the quantity in grosyncCart
    const product = products.find(p => p.id == id || p._id == id);
    if (!product) return null;

    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qtyLabel: product.qty,
      quantity: typeof qty === 'object' ? (qty.quantity || 1) : qty
    };
  }).filter(item => item !== null);
}

function initCartGroupDashboard(code) {
  const infoSection = document.getElementById("groupActiveInfo");
  const codeBox = document.getElementById("cartGroupCode");
  const inactiveActions = document.getElementById("groupInactiveActions");

  if (infoSection && codeBox && inactiveActions) {
    infoSection.style.display = "block";
    codeBox.innerText = code;
    inactiveActions.style.display = "none";
  }

  // Change "My Cart" heading to "Group Cart"
  const h2 = document.querySelector(".cart-page h2");
  if (h2) h2.innerText = "Group Cart";

  updateCartGroupUI(code);
  setInterval(() => updateCartGroupUI(code), 5000);
}

async function updateCartGroupUI(code) {
  try {
    const res = await fetch(`/api/groupbuy/${code}`);
    if (!res.ok) {
      if (res.status === 404) {
        localStorage.removeItem("grosyncGroupCode");
        localStorage.removeItem("grosyncGroupMember");
        alert("This group buy was cancelled or no longer exists.");
        window.location.href = "cart.html";
      }
      return;
    }
    const group = await res.json();

    const currentMember = JSON.parse(localStorage.getItem("grosyncGroupMember"));
    const meMatched = group.members.find(m => String(m.phone).trim() === String(currentMember?.phone).trim());
    const isLeader = meMatched?.isLeader;

    // Show/Hide Cancel button based on leader status
    const groupCancelBtn = document.querySelector(".group-active-info button");
    if (groupCancelBtn) {
      groupCancelBtn.style.display = isLeader ? "flex" : "none";
    }

    if (group.status === 'completed' || group.status === 'pending') {
      localStorage.removeItem("grosyncCart");
      localStorage.removeItem("grosyncCartTotal");
      localStorage.removeItem("grosyncGroupCode");
      localStorage.removeItem("grosyncGroupMember");
      alert("🎉 The leader has successfully finalized and placed the group order! You can track this in your order history.");
      window.location.href = "profile.html?tab=orders";
      return;
    } else if (group.status === 'cancelled') {
      localStorage.removeItem("grosyncCart");
      localStorage.removeItem("grosyncCartTotal");
      localStorage.removeItem("grosyncGroupCode");
      localStorage.removeItem("grosyncGroupMember");
      alert("This group buy was cancelled by the leader.");
      window.location.href = "cart.html";
      return;
    }
    const discountStatus = document.getElementById("groupDiscountStatus");
    if (group.members.length >= 2) {
      discountStatus.innerText = "GROUP ACTIVE! 10% DISCOUNT APPLIED!";
      discountStatus.style.color = "#27ae60";
      if (!window.groupDiscountApplied && location.search.indexOf('discount=applied') === -1) {
        window.groupDiscountApplied = true;
        const url = new URL(location.href);
        url.searchParams.set('discount', 'applied');
        location.replace(url.toString());
      }
    } else {
      discountStatus.innerText = `Add at least 1 neighbor to get 10% OFF! (${group.members.length}/2)`;
      discountStatus.style.color = "#f39c12";
    }

    // --- RENDER GROUP CART (NEAT & CLEAN) ---
    const cartItemsDiv = document.getElementById("cartItems");

    if (cartItemsDiv) {
      cartItemsDiv.innerHTML = "";

      group.members.forEach(member => {
        const memberContainer = document.createElement("div");
        memberContainer.className = "group-member-section";
        memberContainer.style.marginBottom = "25px";
        memberContainer.style.background = "#f9f9f9";
        memberContainer.style.padding = "15px";
        memberContainer.style.borderRadius = "12px";

        const isMe = String(member.phone).trim() === String(currentMember?.phone).trim();

        memberContainer.innerHTML = `
           <div class="member-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #fff; padding-bottom: 10px; margin-bottom: 10px;">
              <h3 style="margin: 0; color: #333;">${member.name} ${member.isLeader ? '<span style="font-size: 12px; background: #6c5ce7; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 10px;">Leader</span>' : ''} ${isMe ? '(You)' : ''}</h3>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 12px; color: ${member.isDone ? '#27ae60' : '#f39c12'}; font-weight: 600;">
                  ${member.isDone ? '<i class="ri-checkbox-circle-fill"></i> Ready' : 'Shopping...'}
                </span>
                ${isMe && !member.isDone ? `
                  <button class="done-btn" onclick="markAsDone('${code}', '${member.phone}')" style="background: #27ae60; color: white; border: none; padding: 5px 15px; border-radius: 6px; cursor: pointer; font-size: 13px;">Done</button>
                ` : ''}
              </div>
           </div>
           <div class="member-products">
              ${(member.cart || []).length > 0 ? member.cart.map(item => `
                <div class="cart-item" style="display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid #eee;">
                  <img src="${item.image || 'assets/images/placeholder.jpg'}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px;">
                  <div style="flex: 1;">
                      <h4 style="margin: 0; font-size: 14px;">${item.name}</h4>
                      <p style="margin: 0; color: #666; font-size: 12px;">₹${item.price} x ${item.quantity}</p>
                  </div>
                  <div style="font-weight: 600;">₹${item.price * item.quantity}</div>
                  ${isMe && !member.isDone ? `
                    <div class="qty-control" style="margin-left: 15px; flex-shrink: 0;">
                      <button class="qty-btn-minus" onclick="updateQty('${item.productId}', -1)">−</button>
                      <span class="qty-val">${item.quantity}</span>
                      <button class="qty-btn-plus" onclick="updateQty('${item.productId}', 1)">+</button>
                    </div>
                  ` : ''}
                </div>
              `).join("") : '<p style="text-align: center; color: #999; font-style: italic; padding: 10px;">Empty cart</p>'}
           </div>
        `;
        cartItemsDiv.appendChild(memberContainer);
      });
    }

    // Update Side Dashboard if it exists (Optional now but let's keep it sync'd)
    const list = document.getElementById("memberList");
    if (list) {
      const currentMember = JSON.parse(localStorage.getItem("grosyncGroupMember"));
      document.getElementById("groupDashboard").style.display = "flex";
      document.getElementById("dashInviteCode").innerText = code;

      list.innerHTML = group.members.map(m => `
          <div class="member-item ${m.isDone ? 'done' : ''}">
            <div class="member-header">
              <div class="member-info">
                <span class="member-name">${m.name} ${m.isLeader ? '<small>(Leader)</small>' : ''}</span>
                <span class="member-status">${m.isDone ? '<i class="ri-checkbox-circle-fill"></i> Ready' : 'Shopping...'}</span>
              </div>
              ${m.phone === currentMember?.phone && !m.isDone ? `
                <button class="done-btn" onclick="markAsDone('${code}', '${m.phone}')">Done</button>
              ` : ''}
            </div>
            <div class="member-cart-preview">
              ${(m.cart || []).length > 0 ? m.cart.map(item => {
        const name = item.name || "Product";
        const qty = item.quantity || 1;
        const price = item.price || 0;
        return `
                  <div class="mini-cart-item">
                    <span>${name} x${qty}</span>
                    <span>₹${(price * qty).toFixed(0)}</span>
                  </div>
                `;
      }).join("") : '<p class="empty-mini">No items yet</p>'}
            </div>
          </div>
        `).join("");

      // Leader-only checkout restriction
      const checkoutBtn = document.getElementById("checkoutBtn");
      const isLeader = group.members.find(m => m.phone === currentMember?.phone)?.isLeader;

      if (checkoutBtn) {
        if (!isLeader) {
          checkoutBtn.disabled = true;
          checkoutBtn.innerText = "Only Leader can Checkout";
          checkoutBtn.style.opacity = "0.6";
        } else if (group.members.length <= 1) {
          checkoutBtn.disabled = true;
          checkoutBtn.innerText = "Wait for members to join";
          checkoutBtn.style.opacity = "0.6";
        } else {
          // Leader check: are others done? (Optional, but let's at least enable it for him)
          checkoutBtn.disabled = false;
          checkoutBtn.innerText = "Proceed to Checkout";
          checkoutBtn.style.opacity = "1";
        }
      }
    }

  } catch (e) { }
}

function toggleDashboard() {
  const dash = document.getElementById("groupDashboard");
  dash.style.display = dash.style.display === "none" ? "flex" : "none";
}
/* =====================
   UPDATE QUANTITY
===================== */
window.updateQty = async function (id, change) {
  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};

  const currentQty = cart[id] || 0;
  const newQty = currentQty + change;
  if (change > 0 && newQty > 12) {
    alert("🚀 Maximum quantity reached! You can add up to 12 items of this product.");
    return;
  }

  cart[id] = newQty;

  if (cart[id] <= 0) {
    delete cart[id];
  }

  localStorage.setItem("grosyncCart", JSON.stringify(cart));

  // Sync to group if exists
  const groupCode = localStorage.getItem("grosyncGroupCode");
  if (groupCode) await syncCartToGroup(groupCode, cart);

  // Sync to DB
  await syncCartToDB(cart);

  location.reload();
}

async function syncCartToDB(cart) {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) return;

  // Ensure products are loaded
  if (!window.ALL_PRODUCTS && typeof ALL_PRODUCTS !== 'undefined') {
    window.ALL_PRODUCTS = ALL_PRODUCTS;
  }
  if (!window.ALL_PRODUCTS) return;

  const cartArray = Object.keys(cart).map(id => {
    const qty = cart[id];
    if (!qty || qty < 1) return null; // Filter invalid quantities

    const product = window.ALL_PRODUCTS.find(p => p.id == id || p._id == id);
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

function renderEmptyCart() {
  const cartPage = document.querySelector(".cart-page");
  if (!cartPage) return;

  // Use class "empty-cart" to match css/cart.css
  cartPage.innerHTML = `
    <div class="empty-cart">
      <i class="ri-shopping-bag-3-line" style="font-size: 48px; color: #ddd; margin-bottom: 16px; display: block;"></i>
      <h3>Your Cart is Empty</h3>
      <p style="margin-bottom: 24px; color: #666;">Looks like you haven't added anything to your cart yet.</p>
      <button class="browse-btn" onclick="window.location.href='home.html'">Browse Products</button>
    </div>
  `;

  // Center it
  cartPage.style.display = "flex";
  cartPage.style.flexDirection = "column";
  cartPage.style.justifyContent = "center";
  cartPage.style.alignItems = "center";
  cartPage.style.minHeight = "60vh";
  cartPage.style.textAlign = "center";

  // Hide header continue shopping button when empty
  const headerBtn = document.getElementById("headerContinueBtn");
  if (headerBtn) headerBtn.style.display = "none";
}

window.markAsDone = async function (code, phone) {
  try {
    const res = await fetch('/api/groupbuy/mark-done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code, phone, isDone: true })
    });
    if (res.ok) {
      alert("You're marked as Ready! The leader will proceed to checkout.");
      location.reload();
    }
  } catch (err) {
    console.error("Failed to mark as done", err);
  }
}

window.cancelGroupBuy = async function () {
  const code = localStorage.getItem("grosyncGroupCode");
  const member = JSON.parse(localStorage.getItem("grosyncGroupMember"));
  if (!code || !member) return;

  const msg = member.isLeader ? "Are you sure you want to cancel this group buy? This will close the group for everyone." : "Are you sure you want to leave this group buy?";
  if (!confirm(msg)) return;

  try {
    const res = await fetch('/api/groupbuy/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: code, phone: member.phone })
    });
    if (res.ok) {
      localStorage.removeItem("grosyncGroupCode");
      localStorage.removeItem("grosyncGroupMember");
      alert(member.isLeader ? "Group buy cancelled successfully." : "You have successfully left the group.");
      location.reload();
    } else {
      let errorMsg = "Failed to cancel group buy.";
      try {
        const data = await res.json();
        if (data.error) errorMsg = data.error;
      } catch (e) {
        // Fallback if not JSON (e.g. if the server is not restarted)
        errorMsg = "Server endpoint not found. Please restart your Node server!";
      }
      alert(errorMsg);
    }
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}
