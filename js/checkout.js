
let selectedAddressId = null;

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  renderSavedAddresses();
});

function renderSavedAddresses() {
  const container = document.getElementById("addressList");
  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  const proceedBtn = document.getElementById("mainProceedBtn");

  if (addresses.length === 0) {
    container.innerHTML = `
            <div style="padding: 20px; border: 1.5px dashed #ccc; border-radius: 12px; text-align: center; width: 100%; box-sizing: border-box;">
                <p style="color: #666; margin-bottom: 12px;">No addresses saved yet.</p>
                <button class="primary-btn" onclick="openAddressModal()" style="padding: 10px 24px; font-size: 14px;">
                  <i class="ri-add-line"></i> Add New Address
                </button>
            </div>
        `;
    proceedBtn.style.display = "none";
    return;
  }

  proceedBtn.style.display = "block";

  const getIcon = (type) => {
    type = type ? type.toLowerCase() : '';
    if (type.includes('home')) return 'ri-home-4-line';
    if (type.includes('work') || type.includes('office')) return 'ri-briefcase-line';
    return 'ri-map-pin-line';
  };

  // Ported Dashboard Style rendering
  container.innerHTML = addresses.map(addr => {
    const isSelected = (selectedAddressId === addr.id) || (!selectedAddressId && addr.isDefault);
    if (isSelected) selectedAddressId = addr.id; // Ensure sync

    const icon = getIcon(addr.addressType);

    return `
    <div class="address-box ${isSelected ? 'selected' : ''}" onclick="selectAddress('${addr.id}')" id="addr-${addr.id}">
      <div class="address-type">
        <i class="${icon}"></i>
        <span>${addr.addressType || 'Home'}</span>
         ${addr.isDefault ? '<span class="order-badge delivered" style="margin-left:auto; font-size:9px">Default</span>' : ''}
         ${isSelected ? '<i class="ri-checkbox-circle-fill selection-indicator"></i>' : ''}
      </div>
      <div class="address-details" style="flex:1; margin-top: 8px;">
        <p style="font-weight:700; color:#1a1a1a; margin-bottom:6px; font-size:15px">${addr.fullName}</p>
        <p style="font-size:13px; color:#555; line-height:1.5">${addr.text}</p>
        <p style="font-size:13px; font-weight:700; color:#3b1a86; margin-top:12px; display:flex; align-items:center; gap:6px">
          <i class="ri-phone-line"></i> ${addr.mobile}
        </p>
      </div>
      <div class="address-actions" onclick="event.stopPropagation()">
        <button class="secondary-btn" onclick="editAddress('${addr.id}')">Edit</button>
        <button class="secondary-btn" style="color:#ef4444; border-color:#fee2e2" onclick="deleteAddress('${addr.id}')">Remove</button>
        ${!addr.isDefault ? `<button class="secondary-btn" style="background:#f0ebff; color:#3b1a86; border-color:#d5c8ff" onclick="setDefaultAddress('${addr.id}')">Set as Default</button>` : ''}
      </div>
    </div>
  `}).join("");

  // Set initial selection fallback
  if (!selectedAddressId && addresses.length > 0) {
    selectedAddressId = addresses[0].id;
  }
}

window.selectAddress = function (id) {
  selectedAddressId = id;
  renderSavedAddresses(); // Rerender for selection state
};

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

window.deleteAddress = async function (id) {
  if (!confirm("Are you sure you want to remove this address?")) return;
  let addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  addresses = addresses.filter(a => a.id != id);
  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));

  if (selectedAddressId == id) selectedAddressId = null;

  renderSavedAddresses();
  await syncAddressesToBackend(addresses);
};

window.setDefaultAddress = async function (id) {
  let addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  addresses.forEach(a => {
    a.isDefault = (a.id == id);
  });
  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));
  renderSavedAddresses();
  await syncAddressesToBackend(addresses);
};

window.saveNewAddress = async function () {
  const id = document.getElementById("addrId").value;
  const addressType = document.getElementById("addrType").value || "Home";
  const name = document.getElementById("addrName").value.trim();
  const mobile = document.getElementById("addrMobile").value.trim();
  const pincode = document.getElementById("addrPincode").value.trim();
  const house = document.getElementById("addrHouse").value.trim();
  const area = document.getElementById("addrArea").value.trim();
  const landmark = document.getElementById("addrLandmark").value.trim();
  const city = document.getElementById("addrCity").value.trim();
  const state = document.getElementById("addrState").value.trim();
  const isDefault = document.getElementById("addrDefault").checked;

  if (!name || !mobile || !pincode || !house || !area || !city || !state) {
    alert("Please fill all fields.");
    return;
  }

  const text = `${house}, ${area}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${pincode}`;

  let addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];

  if (isDefault) {
    addresses.forEach(a => a.isDefault = false);
  }

  if (id) {
    // Edit existing
    const idx = addresses.findIndex(a => a.id == id);
    if (idx !== -1) {
      addresses[idx] = {
        ...addresses[idx],
        addressType, fullName: name, mobile, pincode, houseNo: house, area, city, state, landmark, text, isDefault
      };
    }
  } else {
    // New
    const newAddr = {
      id: Date.now(),
      addressType, fullName: name, mobile, pincode, houseNo: house, area, city, state, landmark, text, isDefault
    };
    if (addresses.length === 0) newAddr.isDefault = true;
    addresses.push(newAddr);
    selectedAddressId = newAddr.id;
  }

  localStorage.setItem("grosyncAddresses", JSON.stringify(addresses));

  closeAddressModal();
  renderSavedAddresses();
  await syncAddressesToBackend(addresses);
};

async function syncAddressesToBackend(addresses) {
  const user = JSON.parse(localStorage.getItem("grosyncLoggedUser"));
  if (!user) return;

  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        savedAddresses: addresses
      })
    });
  } catch (err) { console.error(err); }
}

window.proceedToPayment = function () {
  const addresses = JSON.parse(localStorage.getItem("grosyncAddresses")) || [];
  const selected = addresses.find(a => a.id == selectedAddressId);

  if (!selected) {
    alert("Please select or add a delivery address.");
    return;
  }

  // Save selected address for payment page
  localStorage.setItem("grosyncSelectedAddress", JSON.stringify({
    id: selected.id,
    type: selected.addressType || "Home",
    fullName: selected.fullName,
    address: selected.text,
    mobile: selected.mobile
  }));

  window.location.href = "payment.html";
};
