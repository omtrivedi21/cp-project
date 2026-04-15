/**
 * Smart Cart Recommendation Logic
 * Guesses product exhaustion based on category and quantity.
 */

const DEFAULT_DURATIONS = {
    "Dairy Products": 3,      // 3 days per unit
    "Fruits": 5,             // 5 days
    "Vegetables": 5,         // 5 days
    "Atta, Rice & Dal": 15,  // 15 days
    "Instant Food": 4,       // 4 days
    "Biscuits & Bakery": 7,  // 7 days
    "Oil, Ghee & Masala": 30, // 30 days
    "Daily Essentials": 25,  // 25 days
    "Bath & Body": 30,       // 30 days
    "Feminine Hygiene": 28,  // 28 days
    "Baby Care": 10,         // 10 days
    "Chips & Namkeen": 5,
    "Sweets & Chocolates": 7,
    "Drinks & Beverages": 5,
    "Stationery": 60,
    "default": 10
};

/**
 * Calculates which products from order history are running low.
 * returns Array of { productId, exhaustDate, remainingDays }
 */
window.getSmartRecommendations = function () {
    const history = JSON.parse(localStorage.getItem("grosyncOrderHistory")) || [];
    if (!history.length) return [];

    const lastPurchaseMap = new Map();

    // 1. Find the MOST RECENT purchase date and total quantity for each product
    history.forEach(order => {
        const orderDate = new Date(order.date);
        Object.entries(order.items).forEach(([prodId, qty]) => {
            const pid = Number(prodId);
            if (!lastPurchaseMap.has(pid) || orderDate > lastPurchaseMap.get(pid).date) {
                lastPurchaseMap.set(pid, { date: orderDate, qty: qty });
            }
        });
    });

    const recommendations = [];
    const now = new Date();

    lastPurchaseMap.forEach((info, pid) => {
        const product = (window.ALL_PRODUCTS || []).find(p => p.id === pid);
        if (!product) return;

        const duration = DEFAULT_DURATIONS[product.category] || DEFAULT_DURATIONS.default;
        const totalLifeDays = info.qty * duration;

        const exhaustDate = new Date(info.date.getTime());
        exhaustDate.setDate(exhaustDate.getDate() + totalLifeDays);

        // Calculate time diff in days
        const diffMs = exhaustDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Recommend if it's finishing in 2 days or less
        // But exclude if it's already in the current cart
        const cart = JSON.parse(localStorage.getItem("grosyncCart")) || {};
        const isInCart = !!cart[pid];

        if (diffDays <= 2 && !isInCart) {
            recommendations.push({
                ...product,
                exhaustDays: diffDays,
                isRunningOut: diffDays >= 0,
                isExhausted: diffDays < 0
            });
        }
    });

    // Sort: most urgent first
    return recommendations.sort((a, b) => a.exhaustDays - b.exhaustDays).slice(0, 4);
};
