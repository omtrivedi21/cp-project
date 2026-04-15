// Admin App Logic
const API_URL = '/api/admin';
let currentToken = localStorage.getItem('adminToken');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentToken) {
        showDashboard();
        checkAuth(); // Verify token still valid
    } else {
        // Redirect to main login page if no admin token
        window.location.href = "login.html";
    }

    // Setup Nav
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            switchView(view);
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

// AUTH FUNCTIONS
function handleLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = "login.html";
}
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/stats`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (!res.ok) handleLogout();
    } catch (err) {
        handleLogout();
    }
}

// VIEW ROUTING
function switchView(viewName) {
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

    // Update Title
    const titles = {
        'dashboard': 'Admin Dashboard',
        'products': 'Product Management',
        'orders': 'Order Management',
        'users': 'User Management',
        'sustainability': 'Sustainability Insights',
        'support': 'Live Support'
    };
    document.getElementById('current-view-title').innerText = titles[viewName] || 'Dashboard';

    // Load View
    loadViewData(viewName);
}

async function loadViewData(view) {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div style="text-align: center; padding: 50px;">Loading ecosystem data...</div>';

    try {
        switch (view) {
            case 'dashboard': renderDashboard(); break;
            case 'products': renderProducts(); break;
            case 'orders': renderOrders(); break;
            case 'users': renderUsers(); break;
            case 'sustainability': renderSustainability(); break;
            case 'support': renderSupport(); break;
        }
    } catch (err) {
        container.innerHTML = `<div class="badge badge-danger">Error loading ${view}: ${err.message}</div>`;
    }
}

// VIEW RENDERERS
async function renderDashboard() {
    const res = await fetch(`${API_URL}/stats`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const stats = await res.json();

    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="stats-grid">
            ${renderStatCard('shopping-bag', stats.totalProducts, 'Total Products')}
            ${renderStatCard('shopping-cart', stats.totalOrders, 'Total Orders')}
            ${renderStatCard('users', stats.totalUsers, 'Total Users')}
            ${renderStatCard('indian-rupee', '₹' + stats.totalRevenue.toLocaleString(), 'Total Revenue')}
            ${renderStatCard('leaf', stats.carbonSaved.toFixed(1) + ' kg', 'Carbon Saved')}
        </div>
        
        <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
                <h3>Revenue Trend (Last 7 Days)</h3>
            </div>
            <div class="card-body" style="padding: 24px; min-height: 300px;">
                <canvas id="revenueChart"></canvas>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3>Recent Activity</h3>
            </div>
            <div class="card-body" style="padding: 24px;">
                <p style="color: var(--text-muted)">Real-time grocery ecosystem monitoring is active. All systems eco-friendly.</p>
            </div>
        </div>
    `;
    lucide.createIcons();
    initRevenueChart(stats.weeklyRevenue);
}

function initRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (!data || data.length === 0) return;

    const labels = data.map(d => d._id);
    const revenues = data.map(d => d.dailyRevenue);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Daily Revenue (₹)',
                data: revenues,
                borderColor: '#2E7D32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#2E7D32',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderStatCard(icon, value, label) {
    return `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon"><i data-lucide="${icon}"></i></div>
            </div>
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>
    `;
}

// PRODUCT VIEW
async function renderProducts() {
    const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const products = await res.json();

    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <div style="display: flex; gap: 12px;">
                    <input type="text" placeholder="Search products..." class="form-control" style="width: 250px;">
                    <button class="btn btn-ghost"><i data-lucide="filter"></i> Filter</button>
                </div>
                <button class="btn btn-primary" onclick="openProductModal()">
                    <i data-lucide="plus"></i> Add Product
                </button>
            </div>
            <div class="card-body">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td>${p.id}</td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <img src="${p.image || 'assets/placeholder.png'}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover;">
                                        <span>${p.name}</span>
                                    </div>
                                </td>
                                <td><span class="badge badge-info">${p.category}</span></td>
                                <td>₹${p.price}</td>
                                <td>${p.stock}</td>
                                <td>
                                    <button class="btn btn-ghost btn-sm" onclick="editProduct(${p.id})"><i data-lucide="edit-2" style="width: 16px;"></i></button>
                                    <button class="btn btn-ghost btn-sm" onclick="deleteProduct(${p.id})"><i data-lucide="trash-2" style="width: 16px; color: var(--danger)"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// ORDER VIEW
async function renderOrders() {
    const res = await fetch(`${API_URL}/orders`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const orders = await res.json();

    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="card">
            <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 16px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <h3>Customer Orders</h3>
                    <div class="tabs" style="display: flex; gap: 8px; background: #f5f5f5; padding: 4px; border-radius: 8px;">
                        <button class="btn btn-sm btn-primary" id="tab-orders-ind" onclick="switchOrderTab('individual')">Individual</button>
                        <button class="btn btn-sm btn-ghost" id="tab-orders-grp" onclick="switchOrderTab('group')">Group Orders</button>
                    </div>
                </div>
            </div>
            <div class="card-body" id="orders-content-area">
                <!-- Data will be loaded here via switchOrderTab -->
            </div>
        </div>
    `;
    
    // Initial Load
    switchOrderTab('individual');
}

async function switchOrderTab(tab) {
    const area = document.getElementById('orders-content-area');
    const btnInd = document.getElementById('tab-orders-ind');
    const btnGrp = document.getElementById('tab-orders-grp');
    
    // Toggle active state
    btnInd.className = tab === 'individual' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost';
    btnGrp.className = tab === 'group' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost';
    
    area.innerHTML = '<div style="text-align: center; padding: 40px;">Fetching orders...</div>';

    if (tab === 'individual') {
        renderIndividualOrders(area);
    } else {
        renderGroupOrders(area);
    }
}

async function renderIndividualOrders(area) {
    try {
        const res = await fetch(`${API_URL}/orders`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!res.ok) throw new Error('Failed to fetch orders');
        
        const orders = await res.json();

        if (!orders || orders.length === 0) {
            area.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); text-align: center;">No individual orders found.</div>';
            return;
        }

        area.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td><strong>${o.orderId}</strong></td>
                            <td>
                                <div style="font-weight: 500;">${o.customer ? o.customer.name : 'Guest'}</div>
                                <div style="font-size: 11px; opacity: 0.6;">${o.customer?.email || ''}</div>
                            </td>
                            <td style="font-size: 13px;">${o.customer?.mobile || 'N/A'}</td>
                            <td style="font-weight: 600;">₹${o.totalAmount}</td>
                            <td><span class="badge badge-info" style="font-size: 10px;">${o.paymentMethod || 'COD'}</span></td>
                            <td>
                                <select onchange="updateOrderStatus('${o._id}', this.value)" class="badge ${getStatusBadge(o.status)}" style="border: none; outline: none; cursor: pointer;">
                                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
                                    <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancel & Delete</option>
                                </select>
                            </td>
                            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                            <td>${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error(err);
        area.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444;">Error: ${err.message}. Please restart the server.</div>`;
    }
}

async function renderGroupOrders(area) {
    try {
        const res = await fetch(`${API_URL}/group-orders`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (!res.ok) throw new Error('Failed to fetch group orders');

        const groups = await res.json();

        if (!groups || groups.length === 0) {
            area.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">No group orders found.</div>';
            return;
        }

        area.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Leader</th>
                        <th>Members</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${groups.map(g => `
                        <tr>
                            <td><strong>${g.inviteCode}</strong></td>
                            <td>
                                <div style="font-weight: 500;">${g.leaderPhone}</div>
                                <div style="font-size: 11px; opacity: 0.6;">${g.leaderEmail || ''}</div>
                            </td>
                            <td><span class="badge badge-info">${g.members?.length || 0} / ${g.maxMembers}</span></td>
                            <td><span class="badge badge-info" style="font-size: 10px;">${g.paymentMethod || 'COD'}</span></td>
                            <td><span class="badge ${getStatusBadge(g.status)}">${g.status === 'delivered' ? 'Completed' : g.status}</span></td>
                            <td>${new Date(g.createdAt).toLocaleDateString()}</td>
                            <td>${new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error(err);
        area.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444;">Error: ${err.message}. Please restart the server.</div>`;
    }
}

function getStatusBadge(status) {
    if (status === 'delivered' || status === 'completed') return 'badge-success';
    if (status === 'pending' || status === 'active') return 'badge-warning';
    if (status === 'cancelled' || status === 'expired') return 'badge-danger';
    return 'badge-info';
}

// USER VIEW
async function renderUsers() {
    const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const users = await res.json();

    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="card">
            <div class="card-header"><h3>Platform Users</h3></div>
            <div class="card-body">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Default Address</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <img src="https://ui-avatars.com/api/?name=${u.name}&background=random" style="width: 32px; height: 32px; border-radius: 50%;">
                                        <span>${u.name}</span>
                                    </div>
                                </td>
                                <td>${u.email}</td>
                                <td>${u.phone || u.mobile || 'N/A'}</td>
                                <td>
                                    <div style="max-width: 200px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${getDefaultAddressText(u)}">
                                        ${getDefaultAddressText(u)}
                                    </div>
                                </td>
                                <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                                <td><button class="btn btn-ghost" onclick="showUserHistory('${u._id}')">View History</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// SUSTAINABILITY VIEW
async function renderSustainability() {
    const res = await fetch(`${API_URL}/sustainability`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const data = await res.json();

    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
            <div class="card" style="padding: 24px; text-align: center;">
                <h4 style="margin-bottom: 20px;">Carbon Savings (Global)</h4>
                <div style="font-size: 3rem; font-weight: 800; color: var(--success);">${data.totalCarbon.toFixed(1)} <small>kg CO2</small></div>
                <p style="color: var(--text-muted); margin-top: 10px;">Equivalent to planting <strong>${Math.ceil(data.totalCarbon / 0.5)}</strong> urban trees.</p>
            </div>
        </div>
        <div class="card" style="margin-top: 24px; padding: 24px;">
            <h3>Impact Breakdown</h3>
            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <div style="flex: 1; height: 300px; background: #fbfdfb; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px dashed var(--border);">
                    [Visualizing Sustainability Impact Graph]
                </div>
                <div style="width: 300px;">
                    <ul style="list-style: none;">
                        <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                            <span>Packaging Saved:</span>
                            <strong>84%</strong>
                        </li>
                        <li style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                            <span>Warehouse Efficiency:</span>
                            <strong style="color: var(--success)">+15.2%</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}


// MODAL & CRUD ACTIONS
function openProductModal(prod = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('product-form');

    if (prod) {
        title.innerText = 'Edit Product';
        document.getElementById('prod-id').value = prod.id;
        document.getElementById('prod-name').value = prod.name;
        document.getElementById('prod-price').value = prod.price;
        document.getElementById('prod-stock').value = prod.stock;
        document.getElementById('prod-category').value = prod.category;

    } else {
        title.innerText = 'Add New Product';
        form.reset();
        document.getElementById('prod-id').value = '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const productData = {
        name: document.getElementById('prod-name').value,
        price: Number(document.getElementById('prod-price').value),
        stock: Number(document.getElementById('prod-stock').value),
        category: document.getElementById('prod-category').value,

    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(productData)
        });

        if (res.ok) {
            closeModal();
            renderProducts();
        } else {
            alert('Error saving product');
        }
    } catch (err) {
        console.error(err);
    }
});

async function editProduct(id) {
    const res = await fetch(`${API_URL}/products`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
    const products = await res.json();
    const prod = products.find(p => p.id == id);
    if (prod) openProductModal(prod);
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.ok) renderProducts();
    } catch (err) {
        console.error(err);
    }
}

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ status })
        });
        if (res.ok) loadViewData('orders');
    } catch (err) {
        console.error(err);
    }
}

function showDashboard() {
    switchView('dashboard');
}

function getDefaultAddressText(user) {
    if (!user.savedAddresses || user.savedAddresses.length === 0) return 'No address';
    const def = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
    return `${def.houseNo || ''}, ${def.area || ''}, ${def.city || ''}`.replace(/^, /, '');
}

async function showUserHistory(userId) {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
        const users = await res.json();
        const user = users.find(u => u._id === userId);
        
        if (!user) return alert('User not found');

        const history = user.orderHistory || [];
        
        // Use a simple alert-based modal or create a dynamic one
        const modal = document.createElement('div');
        modal.className = 'product-modal'; // Reuse existing modal styles
        modal.id = 'history-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>Order History: ${user.name}</h3>
                    <button class="btn-ghost" onclick="this.closest('.product-modal').remove()">×</button>
                </div>
                <div class="card-body">
                    ${history.length === 0 ? '<p style="padding: 20px; text-align: center;">No orders found for this user.</p>' : `
                        <table style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(h => `
                                    <tr>
                                        <td><strong>#${h.orderId || h.id}</strong></td>
                                        <td>${new Date(h.timestamp || h.date).toLocaleDateString()}</td>
                                        <td>${(h.items || []).length} items</td>
                                        <td>₹${h.totalAmount || h.total || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.product-modal').remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) {
        console.error('Error fetching history:', err);
        alert('Failed to load user history');
    }
}


// SUPPORT VIEW (REAL-TIME CHAT)
let adminSocket = null;
let currentChatUserId = null;

async function renderSupport() {
    const container = document.getElementById('view-container');
    container.innerHTML = `
        <div class="support-dashboard" style="display: flex; height: calc(100vh - 180px); gap: 20px;">
            <!-- Chats List -->
            <div class="card chat-list-sidebar" style="width: 300px; display: flex; flex-direction: column;">
                <div class="card-header"><h3>Active Chats</h3></div>
                <div class="card-body" id="support-active-list" style="overflow-y: auto; padding: 0;">
                    <div style="padding: 20px; text-align: center; color: var(--text-muted);">Loading chats...</div>
                </div>
            </div>
            
            <!-- Chat Window -->
            <div class="card chat-main-view" style="flex: 1; display: flex; flex-direction: column;">
                <div id="chat-empty-state" style="flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; color: var(--text-muted);">
                    <i data-lucide="message-square" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>Select a conversation to start helping</p>
                </div>
                
                <div id="chat-active-view" style="display: none; flex: 1; flex-direction: column;">
                    <div class="card-header" style="border-bottom: 1px solid var(--border);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img id="active-chat-avatar" src="" style="width: 32px; height: 32px; border-radius: 50%;">
                            <div>
                                <h4 id="active-chat-name">User Name</h4>
                                <span id="active-chat-status" style="font-size: 11px; color: var(--success);">Online</span>
                            </div>
                        </div>
                    </div>
                    <div class="chat-messages" id="support-msg-container" style="flex: 1; padding: 24px; overflow-y: auto; background: #fbfbff; display: flex; flex-direction: column; gap: 12px;">
                    </div>
                    <div style="padding: 0 24px 10px; font-size: 12px; font-style: italic; color: var(--text-muted); display: none;" id="admin-typing-indicator">User is typing...</div>
                    <div class="card-footer" style="padding: 16px; border-top: 1px solid var(--border); display: flex; gap: 12px;">
                        <input type="text" id="admin-chat-input" class="form-control" placeholder="Type your reply...">
                        <button class="btn btn-primary" id="admin-send-btn">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    
    // Initialize Admin Socket if not exists
    if (!adminSocket) {
        adminSocket = io();
        setupAdminSocketEvents();
    }

    // Load active chats
    loadActiveChats();
}

async function loadActiveChats() {
    try {
        const res = await fetch('/api/admin/chats', {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const chats = await res.json();
        const listContainer = document.getElementById('support-active-list');
        
        if (chats.length === 0) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No active conversations</div>';
            return;
        }

        listContainer.innerHTML = chats.map(chat => `
            <div class="chat-list-item ${currentChatUserId === chat.userId ? 'active' : ''}" 
                 onclick="openAdminChat('${chat.userId}', '${chat.userName}')"
                 style="padding: 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; ${currentChatUserId === chat.userId ? 'background: #f0ebff;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="font-size: 14px;">${chat.userName}</strong>
                    <small style="opacity: 0.6; font-size: 11px;">${new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div style="font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${chat.lastMessage || 'New conversation'}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load active chats:', err);
    }
}

function openAdminChat(userId, userName) {
    currentChatUserId = userId;
    
    // UI Updates
    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('chat-active-view').style.display = 'flex';
    document.getElementById('active-chat-name').innerText = userName;
    document.getElementById('active-chat-avatar').src = `https://ui-avatars.com/api/?name=${userName}&background=random`;
    
    // Clear and load history
    const container = document.getElementById('support-msg-container');
    container.innerHTML = '<div style="text-align:center; padding: 20px;">Fetching conversation history...</div>';
    
    // Join room via socket
    adminSocket.emit('admin_join_chat', { userId });
    
    // Reload history list highlights
    loadActiveChats();
    
    // Setup event listeners for input
    const input = document.getElementById('admin-chat-input');
    const sendBtn = document.getElementById('admin-send-btn');
    
    sendBtn.onclick = () => sendAdminMessage();
    input.onkeypress = (e) => { if (e.key === 'Enter') sendAdminMessage(); };
    
    input.focus();
}

function sendAdminMessage() {
    const input = document.getElementById('admin-chat-input');
    const content = input.value.trim();
    if (!content || !currentChatUserId) return;

    adminSocket.emit('send_message', {
        userId: currentChatUserId,
        content,
        senderType: 'admin',
        senderId: 'admin'
    });
    input.value = '';
}

function setupAdminSocketEvents() {
    adminSocket.on('chat_history', (history) => {
        const container = document.getElementById('support-msg-container');
        container.innerHTML = history.map(msg => renderSupportMessage(msg)).join('');
        container.scrollTop = container.scrollHeight;
    });

    adminSocket.on('receive_message', (msg) => {
        // If it's for the currently open chat, append it
        if (currentChatUserId) {
            const container = document.getElementById('support-msg-container');
            const msgHtml = renderSupportMessage(msg);
            container.insertAdjacentHTML('beforeend', msgHtml);
            container.scrollTop = container.scrollHeight;
        }
        // Refresh the sidebar to show last message
        loadActiveChats();
    });

    adminSocket.on('user_typing', ({ userName, isTyping }) => {
        const indicator = document.getElementById('admin-typing-indicator');
        if (indicator) indicator.style.display = isTyping ? 'block' : 'none';
    });
}

function renderSupportMessage(msg) {
    const isUser = msg.senderType === 'user';
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div style="max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; align-self: ${isUser ? 'flex-start' : 'flex-end'}; background: ${isUser ? '#eee' : '#3b1a86'}; color: ${isUser ? '#333' : '#fff'}; border-bottom-${isUser ? 'left' : 'right'}-radius: 2px;">
            ${msg.content}
            <small style="display: block; font-size: 10px; opacity: 0.6; margin-top: 4px; text-align: right;">${time}</small>
        </div>
    `;
}
