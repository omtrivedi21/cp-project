const mongoose = require('mongoose');
const Product = require('./models/Product');
const Recipe = require('./models/Recipe');

const recipeTemplates = {
    "Indian": [
        { name: "Paneer Butter Masala", keywords: ["Paneer", "Butter", "Tomato", "Masala"] },
        { name: "Dal Makhani", keywords: ["Dal", "Ghee", "Cream", "Masala"] },
        { name: "Aloo Gobi", keywords: ["Potato", "Cauliflower", "Masala", "Oil"] },
        { name: "Chana Masala", keywords: ["Kabuli Chana", "Onion", "Tomato", "Masala"] },
        { name: "Palak Paneer", keywords: ["Paneer", "Spinach", "Garlic", "Cream"] },
        { name: "Veg Biryani", keywords: ["Basmati Rice", "Vegetables", "Biryani Masala", "Ghee"] },
        { name: "Jeera Rice", keywords: ["Rice", "Jeera", "Ghee"] },
        { name: "Matar Paneer", keywords: ["Paneer", "Peas", "Tomato", "Masala"] },
        { name: "Baingan Bharta", keywords: ["Brinjal", "Onion", "Tomato", "Garlic"] },
        { name: "Kadai Paneer", keywords: ["Paneer", "Capsicum", "Onion", "Masala"] }
    ],
    "Italian": [
        { name: "Penne Arrabbiata", keywords: ["Penne", "Pasta Sauce", "Garlic", "Chilli"] },
        { name: "Classic Margherita Pizza", keywords: ["Pizza Base", "Cheese", "Tomato Sauce", "Basil"] },
        { name: "Mushroom Risotto", keywords: ["Rice", "Mushroom", "Cheese", "Butter"] },
        { name: "Spaghetti Aglio e Olio", keywords: ["Spaghetti", "Garlic", "Oil", "Chilli"] },
        { name: "Pasta Primavera", keywords: ["Pasta", "Vegetables", "Oil", "Cheese"] },
        { name: "Pasta Alfredo", keywords: ["Pasta", "Milk", "Butter", "Cheese"] },
        { name: "Veggie Lasagna", keywords: ["Pasta", "Cheese", "Tomato Sauce", "Vegetables"] },
        { name: "Minestrone Soup", keywords: ["Pasta", "Beans", "Vegetables", "Tomato"] }
    ],
    "Chinese": [
        { name: "Veg Hakka Noodles", keywords: ["Noodels", "Vegetables", "Soy Sauce", "Vinegar"] },
        { name: "Manchurian with Gravy", keywords: ["Vegetables", "Soy Sauce", "Ginger", "Garlic"] },
        { name: "Fried Rice", keywords: ["Rice", "Vegetables", "Soy Sauce", "Oil"] },
        { name: "Spring Rolls", keywords: ["Flour", "Vegetables", "Oil", "Sauce"] },
        { name: "Gobi Manchurian", keywords: ["Cauliflower", "Soy Sauce", "Ginger", "Garlic"] }
    ],
    "Mexican": [
        { name: "Veggie Tacos", keywords: ["Beans", "Cheese", "Tomato", "Onion"] },
        { name: "Cheese Quesadillas", keywords: ["Tortilla", "Cheese", "Onion", "Chilli"] },
        { name: "Nachos with Salsa", keywords: ["Nachos", "Cheese", "Tomato", "Onion"] },
        { name: "Enchiladas", keywords: ["Cheese", "Sauce", "Beans"] }
    ],
    "Korean": [
        { name: "Kimchi Fried Rice", keywords: ["Rice", "Soy Sauce", "Oil"] },
        { name: "Veg Bibimbap", keywords: ["Rice", "Vegetables", "Soy Sauce"] },
        { name: "Ramen Bowl", keywords: ["Ramen", "Vegetables", "Sauce"] }
    ],
    "Japanese": [
        { name: "Vegetable Sushi", keywords: ["Rice", "Cucumber", "Carrot"] },
        { name: "Veg Gyoza", keywords: ["Flour", "Cabbage", "Ginger", "Soy Sauce"] },
        { name: "Miso Soup", keywords: ["Tofu"] }
    ],
    "American": [
        { name: "Classic Veg Burger", keywords: ["Bun", "Cheese", "Tomato"] },
        { name: "Mac and Cheese", keywords: ["Macaroni", "Cheese", "Milk", "Butter"] },
        { name: "Garden Salad", keywords: ["Tomato", "Cucumber"] },
        { name: "French Fries", keywords: ["Potato", "Oil", "Salt"] }
    ],
    "French": [
        { name: "Ratatouille", keywords: ["Tomato", "Onion", "Garlic", "Capsicum"] },
        { name: "Cheese Soufflé", keywords: ["Cheese", "Milk", "Butter"] },
        { name: "Vegetable Crepes", keywords: ["Flour", "Milk", "Vegetables", "Cheese"] }
    ],
    "Spanish": [
        { name: "Vegetable Paella", keywords: ["Rice", "Beans", "Tomato"] },
        { name: "Patatas Bravas", keywords: ["Potato", "Oil", "Tomato Sauce"] }
    ],
    "Mediterranean": [
        { name: "Hummus with Pita", keywords: ["Garlic", "Oil"] },
        { name: "Greek Salad", keywords: ["Cucumber", "Tomato", "Cheese"] },
        { name: "Falafel Wrap", keywords: ["Cabbage", "Yogurt"] }
    ]
};

const foodCategories = ["Fruits", "Vegetables", "Dairy Products", "Atta, Rice & Dal", "Oil, Ghee & Masala", "Instant Food", "Sauces", "Dryfruit & Cereals", "Sweets & Chocolates"];

async function seedLarge() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');

        await Recipe.deleteMany({});
        console.log('Cleared existing recipes');

        const products = await Product.find({ category: { $in: foodCategories } });
        console.log(`Analyzing ${products.length} food products...`);

        const recipes = [];
        let idCounter = 1;

        const cuisines = Object.keys(recipeTemplates);

        for (const cuisine of cuisines) {
            console.log(`Generating 50 recipes for ${cuisine}...`);
            const templates = recipeTemplates[cuisine];

            for (let i = 0; i < 50; i++) {
                const template = templates[i % templates.length];
                const variantSuffix = i >= templates.length ? ` Type ${Math.floor(i / templates.length) + 1}` : "";
                const finalName = template.name + variantSuffix;

                const veggieOptions = [];
                const categorizedSections = {}; // { sectionTitle: [options] }
                const ingredients = [];

                const categoryToSection = {
                    "Dairy Products": "Dairy & Eggs",
                    "Atta, Rice & Dal": "Grains & Pulses",
                    "Oil, Ghee & Masala": "Oil & Spices",
                    "Sauces": "Sauces & Spreads",
                    "Fruits": "Fruits",
                    "Instant Food": "Instant Mixes",
                    "Dryfruit & Cereals": "Dry Fruits & Cereals",
                    "Sweets & Chocolates": "Sweets"
                };

                for (const keyword of template.keywords) {
                    const k = keyword.toLowerCase();
                    let matchedProds = products.filter(p => {
                        const name = p.name.toLowerCase();
                        const words = name.split(/[\s,]+/);
                        // Strict check: keyword must be a whole word or the name must match keyword exactly
                        const isMatch = words.includes(k) || name === k;
                        if (!isMatch) return false;

                        // Exclusions to avoid broad matches like "Sweet Potato" for "Potato"
                        if (k === 'potato' && (name.includes('sweet') || name.includes('chip') || name.includes('bites'))) return false;
                        if (k === 'paneer' && name.includes('pakoda')) return false;
                        if (k === 'masala' && !template.name.toLowerCase().includes('chana') && name.includes('chana')) return false;
                        if (k === 'masala' && !template.name.toLowerCase().includes('pav bhaji') && name.includes('pav bhaji')) return false;
                        
                        return true;
                    });

                    // Sort to prefer shorter names (usually more "basic" product)
                    matchedProds.sort((a, b) => a.name.length - b.name.length);
                    // Take ONLY the best match for "exact" items
                    matchedProds = matchedProds.slice(0, 1);

                    if (matchedProds.length > 0) {
                        const firstProd = matchedProds[0];

                        // If it's a vegetable, add to the common veggie pool
                        if (firstProd.category === "Vegetables") {
                            matchedProds.forEach(p => {
                                if (!veggieOptions.find(opt => opt.productId === p.id)) {
                                    veggieOptions.push({ productId: p.id, name: p.name });
                                }
                            });
                        } else {
                            // Map category to a proper section title
                            const sectionTitle = categoryToSection[firstProd.category] || "Other Ingredients";
                            if (!categorizedSections[sectionTitle]) {
                                categorizedSections[sectionTitle] = [];
                            }

                            matchedProds.forEach(p => {
                                if (!categorizedSections[sectionTitle].find(opt => opt.productId === p.id)) {
                                    categorizedSections[sectionTitle].push({ productId: p.id, name: p.name });
                                }
                            });
                        }

                        // Default ingredient
                        if (!ingredients.find(ing => ing.productId === firstProd.id)) {
                            ingredients.push({ productId: firstProd.id, qty: 1 });
                        }
                    }
                }

                const finalSections = [];
                // Add consolidated Veggies section first if it has items
                if (veggieOptions.length > 0) {
                    finalSections.push({
                        title: "Veggies",
                        type: 'checkbox',
                        options: veggieOptions
                    });
                }

                // Add other categorized sections
                Object.keys(categorizedSections).forEach(title => {
                    finalSections.push({
                        title: title,
                        type: 'radio',
                        options: categorizedSections[title]
                    });
                });

                if (finalSections.length > 0) {
                    recipes.push({
                        id: idCounter++,
                        name: finalName,
                        cuisine: cuisine,
                        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
                        isCustomizable: true,
                        sections: finalSections,
                        ingredients: ingredients
                    });
                }
            }
        }

        await Recipe.insertMany(recipes);
        console.log(`✅ Successfully seeded ${recipes.length} recipes!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedLarge();
