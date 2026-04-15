
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    window.location.href = "home.html";
    return;
  }

  // Update Sidebar
  document.getElementById("userName").innerText = user.name || "User";
  if (document.getElementById("userEmail")) {
    document.getElementById("userEmail").innerText = user.email || "";
  }

  // Update Avatar Initials
  const avatarCircle = document.querySelector(".avatar-circle");
  if (avatarCircle && user.name) {
    const names = user.name.trim().split(" ");
    const initials = names.length > 1
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : names[0][0].toUpperCase();
    avatarCircle.innerText = initials;
  }

  // Initial render
  renderOrders();
  renderAddresses();

  // Pre-fill Settings Form
  document.getElementById("set-name").value = user.name || "";
  document.getElementById("set-email").value = user.email || "";

  // Activity Info
  document.getElementById("profile-created-at").innerText = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A";
  document.getElementById("profile-last-login").innerText = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Just now";

  // Check for Cloud Sync
  syncCloudToLocal();

  // Load products for cart sync if needed
  fetch('/api/products')
    .then(res => res.json())
    .then(products => {
      window.ALL_PRODUCTS = products;
    })
    .catch(err => console.error("Error loading products for sync:", err));
});

/* =========================
   TAB SWITCHING
========================= */
window.switchTab = function (tabName) {
  // Update nav buttons
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute('onclick').includes(`'${tabName}'`)) {
      btn.classList.add("active");
    }
  });

  // Update tab content
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
  });
  document.getElementById(tabName + "Tab").classList.add("active");
};

/* =========================
   ORDER HISTORY
========================= */
function renderOrders() {
  const container = document.getElementById("ordersList");
  const orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ri-shopping-bag-line icon"></i>
        <h3>No orders yet</h3>
        <p>Your order history will appear here once you make a purchase.</p>
        <button class="primary-btn" onclick="window.location.href='home.html'">Shop Now</button>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    try {
      // Simulation logic: If 15 mins (15 * 60 * 1000 ms) passed, mark as Delivered
      let currentStatus = order.status || "Ordered";
      let displayedStatus = currentStatus;
      const fifteenMins = 15 * 60 * 1000;

      // Check timestamp or parse date if timestamp missing
      const orderTime = order.timestamp || (order.date ? new Date(order.date).getTime() : Date.now());
      const timePassed = Date.now() - orderTime;

      if (!isNaN(timePassed) && timePassed > fifteenMins && currentStatus.toUpperCase() !== "CANCELLED" && currentStatus.toUpperCase() !== "DELIVERED") {
        displayedStatus = "DELIVERED";
      }

      const badgeClass = displayedStatus.toLowerCase().replace(/\s+/g, '-');

      return `
      <div class="order-card-v2" onclick="openOrderModal('${order.id}')" style="cursor:pointer; padding: 12px; margin-bottom: 12px; position: relative;">
        ${(order.isGroupOrder || order.groupCode) ? `
        <div class="group-buy-tag" style="position: absolute; top: -8px; left: 12px; background: #6c5ce7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
           Group Buy
        </div>` : ''}
        <div class="order-top" style="margin-bottom: 8px; margin-top: ${(order.isGroupOrder || order.groupCode) ? '8px' : '0'};">
          <div class="order-meta">
            <span class="order-id" style="font-weight: 800; color: #3b1a86;">${order.orderNo || ('#' + String(order.id).slice(-6).toUpperCase())}</span>
            <span class="order-date" style="font-size: 11px; margin-left: 8px;">${order.date && !isNaN(new Date(order.date)) ? new Date(order.date).toLocaleDateString() : order.date}</span>
          </div>
          <div class="order-badge ${badgeClass}" style="padding: 2px 8px; font-size: 10px;">${displayedStatus.toUpperCase()}</div>
        </div>
        <div class="order-summary" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div class="items-count" style="font-size: 12px; color: #666;">${(order.items || []).length} items • ${order.paymentMethod || order.payment || 'COD'}</div>
          <div class="order-total" style="font-weight:700; color:#1a1a1a; font-size: 15px;">₹${order.total || order.totalAmount || 0}</div>
        </div>
        <div class="order-actions" style="display: flex; gap: 8px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
          ${(displayedStatus.toUpperCase() !== "DELIVERED" && displayedStatus.toUpperCase() !== "CANCELLED" && !order.isGroupOrder && !order.groupCode) ?
          `<button class="secondary-btn" style="padding: 6px 12px; font-size: 12px; color: #d63031; border-color: #fab1a0;" onclick="event.stopPropagation(); cancelOrder('${order.id}')">Cancel</button>` : ''}
          <button class="primary-btn" style="padding: 6px 12px; font-size: 12px; background: #3b1a86;" onclick="event.stopPropagation(); reorderItems('${order.id}')">Reorder</button>
          <button class="secondary-btn" style="padding: 6px 12px; font-size: 12px; border-color: #3b1a86; color: #3b1a86;" onclick="event.stopPropagation(); downloadInvoice('${order.id}')">Invoice</button>
        </div>
      </div>
      `;
    } catch (e) {
      console.error("Error rendering order:", order, e);
      return "";
    }
  }).join("");
}

window.downloadInvoice = function (orderId) {
  const orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primaryColor = [59, 26, 134]; // #3b1a86
  const ecoColor = [46, 125, 50]; // #2e7d32

  // 1. HEADER BANNER
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  // Logo & Title
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("GroSync", 20, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("ECO-FRIENDLY GROCERY STORE", 20, 30);

  // Invoice Label
  doc.setFontSize(20);
  doc.text("INVOICE", 190, 25, { align: "right" });

  // 2. ORDER METADATA (Two-Column Layout)
  let topY = 55;
  doc.setTextColor(0);
  
  // Left Column: Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER DETAILS", 20, topY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Order No: ${order.orderNo || order.id}`, 20, topY + 8);
  doc.text(`Date: ${order.date}`, 20, topY + 14);
  doc.text(`Payment: ${order.payment || order.paymentMethod || 'COD'}`, 20, topY + 20);
  doc.text(`Status: ${(order.status || 'Confirmed').toUpperCase()}`, 20, topY + 26);

  // Right Column: Customer info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 120, topY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  // Fix Customer Name bug
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser")) || {};
  let customerName = order.customer;
  if (!customerName || customerName === "undefined") customerName = user.name || "Valued Customer";
  if (typeof customerName === 'object') customerName = customerName.name || user.name || "Customer";
  
  doc.text(customerName, 120, topY + 8);
  
  // Address
  let addrText = "Standard Delivery";
  if (typeof order.address === 'string') {
    addrText = order.address;
  } else if (order.address && typeof order.address === 'object') {
    addrText = order.address.text || order.address.address || `${order.address.houseNo || ''}, ${order.address.area || ''}, ${order.address.city || ''}`;
  }
  const splitAddress = doc.splitTextToSize(addrText, 70);
  doc.text(splitAddress, 120, topY + 14);

  // 3. PRODUCT TABLE
  let tableY = topY + 45;
  
  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, tableY, 170, 10, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, tableY + 6.5);
  doc.text("Qty", 120, tableY + 6.5, { align: "center" });
  doc.text("Rate", 150, tableY + 6.5, { align: "right" });
  doc.text("Amount", 185, tableY + 6.5, { align: "right" });

  // Table Body Rows
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  let y = tableY + 18;
  const items = order.items || [];
  
  items.forEach((item, index) => {
    // Alternate Background for Rows
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 255);
      doc.rect(20, y - 6, 170, 9, "F");
    }

    doc.text(item.name || "Product", 25, y);
    doc.text(`${item.qty || item.quantity}`, 120, y, { align: "center" });
    doc.text(`Rs. ${item.price}`, 150, y, { align: "right" });
    doc.text(`Rs. ${(item.qty || item.quantity) * (item.price || 0)}`, 185, y, { align: "right" });
    y += 9;
  });

  // 4. TOTALS
  y += 5;
  doc.setDrawColor(200);
  doc.line(110, y, 190, y);
  
  y += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 140, y, { align: "right" });
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Rs. ${order.total || order.totalAmount || 0}`, 190, y, { align: "right" });

  // 5. FOOTER
  y = Math.max(y + 30, 260); // Ensure footer at bottom section
  doc.setDrawColor(ecoColor[0], ecoColor[1], ecoColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);

  doc.setFontSize(10);
  doc.setTextColor(ecoColor[0], ecoColor[1], ecoColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for choosing GroSync!", 105, y + 8, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Small actions, big change. You saved ~200g of plastic by ordering with us today.", 105, y + 14, { align: "center" });
  doc.text("grosync.eco | info@grosync.com", 105, y + 20, { align: "center" });

  doc.save(`GroSync_Invoice_${order.orderNo || order.id}.pdf`);
};

window.cancelOrder = async function (orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  let orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    orders[idx].status = "CANCELLED";
    orders[idx].paymentStatus = "Cancelled";
    localStorage.setItem("grosyncOrderHistory", JSON.stringify(orders));

    // Sync with cloud
    const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
    if (user) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, orderHistory: orders })
        });
      } catch (e) { console.error("Cancel sync failed", e); }
    }
    renderOrders();
    alert("Order cancelled successfully.");
  }
};

window.reorderItems = function (orderId) {
  const orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
  const order = orders.find(o => o.id === orderId);
  if (order && order.items) {
    let cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
    order.items.forEach(item => {
      const pId = item.id || item.productId;
      cart[pId] = (cart[pId] || 0) + (item.qty || item.quantity || 1);
    });
    localStorage.setItem("grosyncCart", JSON.stringify(cart));
    alert("Items added back to cart! Redirecting to cart...");
    window.location.href = "cart.html";
  }
};

window.refreshOrders = async function () {
  await syncCloudToLocal();
  renderOrders();
};

/* =========================
   ORDER MODAL
========================= */
const orderModal = document.getElementById("orderDetailModal");

window.openOrderModal = function (orderId) {
  const orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const subtotal = (order.items || []).reduce((sum, item) => sum + (Number(item.qty || item.quantity || 1) * Number(item.price || 0)), 0);
  const deliveryFee = 40;
  const expectedTotal = subtotal + deliveryFee;
  const totalPaid = Number(order.total || order.totalAmount || 0);
  const savings = Math.max(0, expectedTotal - totalPaid);

  const content = document.getElementById("orderDetailContent");
  content.innerHTML = `
      <div class="order-detail-header" style="background: #f8f6ff; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #666;">Order Details</span>
          <span style="font-weight: 700; color: #3b1a86;">${order.orderNo || 'Order'}</span>
        </div>
        <div class="detail-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
          <div><i class="ri-calendar-line"></i> ${order.date && !isNaN(new Date(order.date)) ? new Date(order.date).toLocaleDateString() : order.date}</div>
          <div><i class="ri-time-line"></i> ${order.time || (order.date && !isNaN(new Date(order.date)) ? new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--')}</div>
          <div><i class="ri-user-line"></i> ${order.customer && typeof order.customer === 'object' ? order.customer.name : (order.customer || 'User')}</div>
          <div><i class="ri-wallet-line"></i> ${order.payment || order.paymentMethod || 'COD'}</div>
        </div>
      </div>
      
      <div class="order-items-list" style="margin-bottom: 20px;">
        ${(order.items || []).map(item => `
          <div class="order-item-mini" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px dotted #eee;">
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px; color: #1a1a1a;">
                ${item.name}
                ${item.orderedBy ? `<span style="font-size:10px; background:#e0d8f7; color:#3b1a86; padding:2px 6px; border-radius:10px; margin-left:6px; display:inline-block; transform:translateY(-1px);">By: ${item.orderedBy}</span>` : ''}
              </div>
              <div style="font-size: 12px; color: #888;">${item.qty || item.quantity} x ₹${item.price}</div>
            </div>
            <div style="font-weight: 700; font-size: 14px; color: #1a1a1a;">₹${(item.qty || item.quantity) * (item.price || 0)}</div>
          </div>
        `).join("")}
      </div>
      
      <div class="order-total-block" style="background: #fafafa; padding: 15px; border-radius: 12px;">
        <div class="total-row" style="display:flex; justify-content:space-between; font-size:13px; margin-bottom: 8px; color: #666;">
          <span>Items Total</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="total-row" style="display:flex; justify-content:space-between; font-size:13px; margin-bottom: 8px; color: #666;">
          <span>Delivery Fee</span>
          <span>₹${deliveryFee}</span>
        </div>
        ${savings > 0 ? `
        <div class="total-row" style="display:flex; justify-content:space-between; font-size:13px; margin-bottom: 8px; color: #15803d; font-weight: 600;">
          <span>${(order.isGroupOrder || order.groupCode) ? 'Total Savings (Group Buy)' : 'Coupons & Offers'}</span>
          <span>-₹${savings}</span>
        </div>` : ''}
        <div class="total-row grand-total" style="display:flex; justify-content:space-between; font-size:18px; font-weight:800; color:#3b1a86; border-top:1px solid #ddd; padding-top:12px; margin-top:5px">
          <span>Grand Total</span>
          <span>₹${totalPaid}</span>
        </div>
      </div>
    `;

  orderModal.classList.remove("hidden");
};

window.closeOrderModal = function () {
  orderModal.classList.add("hidden");
};

/* =========================
   ADDRESS MANAGEMENT
========================= */
function renderAddresses() {
  const list = document.getElementById("addressList");
  if (!list) return;
  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];

  if (addresses.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center;">
        <i class="ri-map-pin-line" style="font-size: 40px; color: #ccc;"></i>
        <p style="color: #666; margin-top: 10px;">No saved addresses found.</p>
        <button class="add-new-btn" style="margin: 20px auto" onclick="openAddressModal()">Add New Address</button>
      </div>
    `;
    return;
  }

  list.innerHTML = addresses.map(addr => `
    <div class="address-box ${addr.isDefault ? 'default' : ''}">
      <div class="address-type">
        <i class="ri-map-pin-line"></i>
        <span>${addr.addressType || 'Home'}</span>
        ${addr.isDefault ? '<span class="order-badge delivered" style="margin-left:auto; font-size:10px; font-weight:700">DEFAULT</span>' : ''}
      </div>
      <div class="address-details" style="flex:1; margin-top: 8px;">
        <p style="font-weight:700; color:#1a1a1a; margin-bottom:6px; font-size:15px">${addr.fullName}</p>
        <p style="font-size:13px; color:#555; line-height:1.5">${addr.text}</p>
        <p style="font-size:13px; font-weight:700; color:#3b1a86; margin-top:12px; display:flex; align-items:center; gap:6px">
          <i class="ri-phone-line"></i> ${addr.mobile}
        </p>
      </div>
      <div class="address-actions" style="display:flex; gap:10px; margin-top:20px; padding-top:15px; border-top:1px solid #f5f5f5">
        <button class="secondary-btn" style="padding:8px 14px; font-size:12px" onclick="editAddress('${addr.id}')">Edit</button>
        <button class="secondary-btn" style="padding:8px 14px; font-size:12px; color:#ef4444; border-color:#fee2e2" onclick="deleteAddress(event, '${addr.id}')">Remove</button>
        ${!addr.isDefault ? `<button class="secondary-btn" style="padding:8px 14px; font-size:12px; background:#f0ebff; color:#3b1a86; border-color:#d5c8ff" onclick="setDefaultAddress('${addr.id}')">Set as Default</button>` : ''}
      </div>
    </div>
  `).join("");
}

window.openAddressModal = function () {
  document.getElementById("addrId").value = "";
  document.getElementById("addrType").value = "Home";
  document.getElementById("addrName").value = "";
  document.getElementById("addrMobile").value = "";
  document.getElementById("addrPincode").value = "";
  document.getElementById("addrHouse").value = "";
  document.getElementById("addrArea").value = "";
  document.getElementById("addrLandmark").value = "";
  document.getElementById("addrCity").value = "";
  document.getElementById("addrState").value = "";
  document.getElementById("addrDefault").checked = false;
  document.getElementById("addressModalTitle").innerText = "Add a new address";
  document.getElementById("addressModal").classList.remove("hidden");
};

window.closeAddressModal = function () {
  document.getElementById("addressModal").classList.add("hidden");
};

window.editAddress = function (id) {
  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  const addr = addresses.find(a => a.id == id);
  if (!addr) return;

  document.getElementById("addrId").value = addr.id;
  document.getElementById("addrType").value = addr.addressType || "Home";
  document.getElementById("addrName").value = addr.fullName;
  document.getElementById("addrMobile").value = addr.mobile;
  document.getElementById("addrPincode").value = addr.pincode;
  document.getElementById("addrHouse").value = addr.houseNo;
  document.getElementById("addrArea").value = addr.area;
  document.getElementById("addrLandmark").value = addr.landmark || "";
  document.getElementById("addrCity").value = addr.city;
  document.getElementById("addrState").value = addr.state;
  document.getElementById("addrDefault").checked = addr.isDefault;

  document.getElementById("addressModalTitle").innerText = "Edit address";
  document.getElementById("addressModal").classList.remove("hidden");
};

window.saveAddress = async function () {
  const id = document.getElementById("addrId").value;
  const addressType = document.getElementById("addrType").value;
  const name = document.getElementById("addrName").value;
  const mobile = document.getElementById("addrMobile").value;
  const pincode = document.getElementById("addrPincode").value;
  const house = document.getElementById("addrHouse").value;
  const area = document.getElementById("addrArea").value;
  const landmark = document.getElementById("addrLandmark").value;
  const city = document.getElementById("addrCity").value;
  const state = document.getElementById("addrState").value;
  const isDefault = document.getElementById("addrDefault").checked;

  if (!name || !mobile || !pincode || !house || !area || !city || !state) {
    alert("Please fill all required fields");
    return;
  }

  // Clean address text if it contains phone repetitions (happens if user pastes whole block)
  let cleanHouse = house.split("Phone:")[0].split("India Phone:")[0].trim();
  if (cleanHouse.endsWith(",")) cleanHouse = cleanHouse.slice(0, -1).trim();

  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  const text = `${cleanHouse}, ${area}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${pincode}`;

  const newAddr = {
    id: id || Date.now(),
    addressType, fullName: name, mobile, pincode, houseNo: cleanHouse, area, landmark, city, state, isDefault, text
  };

  if (isDefault) {
    addresses.forEach(a => a.isDefault = false);
  }

  if (id) {
    const index = addresses.findIndex(a => a.id == id);
    addresses[index] = newAddr;
  } else {
    if (addresses.length === 0) newAddr.isDefault = true;
    addresses.push(newAddr);
  }

  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));
  closeAddressModal();
  renderAddresses();
  await syncUserData();
};

window.deleteAddress = async function (e, id) {
  if (!confirm("Are you sure you want to remove this address?")) return;
  let addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  addresses = addresses.filter(a => a.id != id);
  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));
  renderAddresses();
  await syncUserData();
};

window.setDefaultAddress = async function (id) {
  let addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  addresses.forEach(a => {
    a.isDefault = (a.id == id);
  });
  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));
  renderAddresses();
  await syncUserData();
};

/* =========================
   SYNC DATA TO CLOUD
========================= */
async function syncUserData() {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user || !user.email) return;

  const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
  const orders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];

  // Convert cart object to array if we have ALL_PRODUCTS
  let cartArray = cart;
  if (window.ALL_PRODUCTS && Object.keys(cart).length > 0) {
    cartArray = Object.keys(cart).map(id => {
      const product = window.ALL_PRODUCTS.find(p => p.id == id || p._id == id);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qtyLabel: product.qty,
        quantity: cart[id]
      };
    }).filter(i => i !== null);
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        savedCart: cartArray,
        orderHistory: orders,
        savedAddresses: addresses
      })
    });
    if (res.ok) {
      console.log("✅ Data synced to cloud");
    } else {
      const errData = await res.json();
      console.error("❌ Sync failed:", errData);
      alert("Warning: Address could not be saved to your account. Please try logging in again.");
    }
  } catch (err) {
    console.error("❌ Sync failed error:", err);
  }
}

async function syncCloudToLocal() {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user || !user.email) return;

  try {
    const res = await fetch(`/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // SMART MERGE: Don't just overwrite, merge unique orders
        let cloudOrders = data.user.orderHistory || [];
        let localOrders = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];

        // Create a map of orders by ID
        const mergedMap = new Map();

        // Add cloud orders first
        cloudOrders.forEach(o => mergedMap.set(String(o.orderId || o.id), o));

        // Add local orders (they might have more recent statuses like 'CANCELLED')
        localOrders.forEach(o => {
          const id = String(o.orderId || o.id);
          if (!mergedMap.has(id)) {
            mergedMap.set(id, o);
          } else {
            // If local has 'CANCELLED', keep it
            if (o.status && o.status.toUpperCase() === "CANCELLED") {
              mergedMap.get(id).status = "CANCELLED";
            }
          }
        });

        const finalOrders = Array.from(mergedMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        localStorage.setItem("grosyncOrderHistory", JSON.stringify(finalOrders));
        localStorage.setItem("grosyncAddresses", JSON.stringify(data.user.savedAddresses || []));
        renderOrders();
        renderAddresses();
      }
    }
  } catch (err) { console.error(err); }
}

/* =========================
   LOGOUT
========================= */
async function logoutUser() {
  if (confirm("Are you sure you want to logout?")) {
    await syncUserData();
    localStorage.clear();
    window.location.href = "home.html";
  }
}

/* =========================
   DELETE ACCOUNT
========================= */
async function deleteAccount() {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user || !user.email) return;

  if (confirm("Are you sure? This will permanently delete your account and all data.")) {
    try {
      // Use relative path for better compatibility
      const res = await fetch(`/api/users/${user.email}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Account deleted successfully.");
        localStorage.clear();
        window.location.href = "home.html";
      } else {
        const data = await res.json();
        alert("Deletion failed: " + (data.msg || "Server Error"));
      }
    } catch (err) { 
      console.error("Delete account error:", err);
      alert("Could not connect to server to delete account: " + err.message); 
    }
  }
}

/* =========================
   SETTINGS
========================= */
const isValidPassword = (pwd) => {
  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);
};

window.updateAccountSettings = async function () {
  const name = document.getElementById("set-name").value;
  const email = document.getElementById("set-email").value;
  const password = document.getElementById("set-password").value;
  const confirm = document.getElementById("set-confirm").value;

  if (password) {
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }
    // Complexity Check
    if (!isValidPassword(password)) {
      alert("New password must have:\n• 8+ chars\n• 1 uppercase\n• 1 number\n• 1 symbol");
      return;
    }
  }

  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  try {
    const res = await fetch("http://localhost:3000/api/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentEmail: user.email,
        name: name,
        email: email,
        password: password || undefined
      })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("grosyncLoggedUser", JSON.stringify(data.user));
      alert("Settings updated!");
      location.reload();
    }
  } catch (err) { console.error(err); }
};
