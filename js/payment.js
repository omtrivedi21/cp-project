// payment.js
window.onerror = function(msg, url, line) {
    alert("Script Error: " + msg + "\nURL: " + url + "\nLine: " + line);
};
document.addEventListener("DOMContentLoaded", () => {
    loadOrderSummary();
});

function loadOrderSummary() {
    const total = localStorage.getItem("grosyncCartTotal");
    const address = JSON.parse(localStorage.getItem("grosyncSelectedAddress"));

    if (total) {
        const amountEl = document.getElementById("payAmount");
        const footerAmountEl = document.getElementById("footerPayAmount");
        
        if (amountEl) amountEl.innerText = "₹" + total;
        if (footerAmountEl) footerAmountEl.innerText = "₹" + total;

        document.querySelectorAll(".pay-btn").forEach(btn => {
            const baseText = btn.innerText.includes(" ₹") ? btn.innerText.split(' ₹')[0] : btn.innerText;
            btn.innerText = baseText + " ₹" + total;
        });
    }

    if (address) {
        const type = address.type || "Delivery Address";
        const name = address.fullName || "User";
        const fullAddr = address.address || address.text || "Standard Delivery";
        const phone = address.mobile || "";

        document.getElementById("deliveringToAddress").innerHTML = `
            <div style="margin-bottom: 4px;">
                <span class="eco-badge" style="padding: 2px 8px; font-size: 10px; margin-bottom: 5px; display: inline-block;">${type}</span>
                <span style="font-weight: 700; color: #1a1a1a; display: block; font-size: 14px;">${name}</span>
            </div>
            <div style="font-size: 11px; color: #555; line-height: 1.4;">
                ${fullAddr.replace(/\n/g, '<br>')}
            </div>
            ${phone ? `<div style="font-size: 11px; font-weight: 600; color: #3b1a86; margin-top: 5px;">
                <i class="ri-phone-line"></i> ${phone}
            </div>` : ''}
        `;
    }
}

async function processPayment(method) {
    console.log("processPayment called with method:", method);
    
    // Robustly parse total
    let totalRaw = localStorage.getItem("grosyncCartTotal") || "0";
    let totalClean = totalRaw.replace(/[^0-9.]/g, '');
    const total = parseFloat(totalClean);

    const user = JSON.parse(localStorage.getItem("grosyncLoggedUser")) || { name: 'Guest', email: '', phone: '' };

    if (isNaN(total) || total <= 0) {
        alert("Invalid amount. Please re-add items to cart.");
        return;
    }

    if (method === 'COD') {
        const confirmed = confirm("Confirm placing order with Cash on Delivery?");
        if (confirmed) {
            return finalizeOrder('COD');
        }
        return;
    }

    try {
        setProcessingMessage("Initializing Secure Payment...");
        document.getElementById("processingModal").classList.remove("hidden");

        const orderResponse = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: total,
                receipt: `order_${Date.now()}`
            })
        });

        const rzpOrder = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(rzpOrder.error || "Order creation failed");

        const options = {
            key: "rzp_test_ScTkFCgBGArz6t",
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            name: "GroSync Eco Store",
            description: "Secured by Razorpay",
            order_id: rzpOrder.id,
            handler: async function (response) {
                try {
                    setProcessingMessage("Verifying Payment Authenticity...");
                    const verifyResponse = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    const verifyData = await verifyResponse.json();
                    if (verifyData.status === 'ok') {
                        setProcessingMessage("Payment Verified! Completing Order...");
                        finalizeOrder('ONLINE', response.razorpay_payment_id);
                    } else {
                        throw new Error("Payment verification failed");
                    }
                } catch (err) {
                    alert("Verification Error: " + err.message);
                    document.getElementById("processingModal").classList.add("hidden");
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: user.phone || user.mobile
            },
            theme: { color: "#2E7D32" },
            modal: {
                ondismiss: function() {
                    document.getElementById("processingModal").classList.add("hidden");
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("Payment Error:", err);
        alert("Failed to start payment: " + err.message);
        document.getElementById("processingModal").classList.add("hidden");
    }
}

function setProcessingMessage(msg) {
    const procTitle = document.getElementById("procTitle");
    if (procTitle) procTitle.innerText = msg;
}

async function finalizeOrder(method, paymentId = null) {
    try {
        const cartItems = JSON.parse(localStorage.getItem("grosyncCart")) || {};
        const total = localStorage.getItem("grosyncCartTotal");
        const selectedAddress = JSON.parse(localStorage.getItem("grosyncSelectedAddress"));
        const user = JSON.parse(localStorage.getItem("grosyncLoggedUser")) || {};

        if (!window.ALL_PRODUCTS) {
            const res = await fetch('/api/products');
            window.ALL_PRODUCTS = await res.json();
        }

        const enrichedItems = Object.entries(cartItems).map(([id, qty]) => {
            const p = window.ALL_PRODUCTS.find(x => x.id == id || x._id == id);
            return {
                id: p ? p._id || p.id : id,
                name: p ? p.name : "Item",
                qty: qty,
                price: p ? p.price : 0
            };
        });

        const order = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            orderNo: "#" + Date.now().toString().slice(-6),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customer: selectedAddress?.fullName || user.name || "Guest",
            phone: selectedAddress?.mobile || user.phone || "",
            email: user.email || "",
            address: selectedAddress || "Standard Delivery",
            items: enrichedItems,
            total: total,
            status: "pending",
            paymentStatus: method === 'COD' ? "Pending" : "Completed",
            payment: method,
            razorpayPaymentId: paymentId
        };

        const groupCode = localStorage.getItem("grosyncGroupCode");
        const groupMember = JSON.parse(localStorage.getItem("grosyncGroupMember"));

        if (groupCode && groupMember && groupMember.isLeader) {
            const gRes = await fetch('/api/groupbuy/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteCode: groupCode,
                    leaderPhone: groupMember.phone,
                    orderDetails: order
                })
            });
            if (!gRes.ok) throw new Error("Group Order failed to sync");
        } else {
            const history = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
            history.unshift(order);
            localStorage.setItem("grosyncOrderHistory", JSON.stringify(history));

            await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    savedCart: [],
                    orderHistory: history,
                    savedAddresses: JSON.parse(localStorage.getItem("grosyncAddresses")) || []
                })
            });

            await fetch('/api/products/decrement-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: enrichedItems })
            });
        }

        alert("Order Placed Successfully! 🎉");
        localStorage.removeItem("grosyncCart");
        localStorage.removeItem("grosyncCartTotal");
        localStorage.removeItem("grosyncGroupCode");
        localStorage.removeItem("grosyncGroupMember");
        window.location.href = "profile.html";

    } catch (err) {
        console.error("Finalize Error:", err);
        alert("Order completed but sync failed: " + err.message);
        window.location.href = "profile.html";
    }
}

function toggleCardForm() {
    alert("Please use the 'Pay Online' option to enter your card details securely.");
}

window.selectPaymentMethod = function(method) {
    // Reset all options
    document.querySelectorAll('.method-option').forEach(opt => opt.classList.remove('expanded'));
    document.querySelectorAll('.method-body').forEach(body => body.classList.add('hidden'));
    document.querySelectorAll('.radio-circle').forEach(rd => rd.classList.remove('selected'));

    // Select target option
    const target = document.getElementById(`method-${method}`);
    if (target) {
        target.classList.add('expanded');
        target.querySelector('.method-body').classList.remove('hidden');
        document.getElementById(`radio-${method}`).classList.add('selected');

        // Update Sticky Button Text for Mobile
        const stickyBtn = document.querySelector('.sticky-pay-btn');
        if (stickyBtn) {
            stickyBtn.innerText = method === 'COD' ? "Place Order" : "Pay Now";
        }
    }
};

window.triggerMobilePay = function() {
    const selected = document.querySelector('.radio-circle.selected');
    if (!selected) {
        alert("Please select a payment method.");
        return;
    }
    const method = selected.id.replace('radio-', '');
    processPayment(method);
};
