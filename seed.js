const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Recipe = require('./models/Recipe');

dotenv.config();

const recipeTemplates = {
    "Indian": [
        { name: "Paneer Butter Masala", keywords: ["Paneer", "Butter", "Tomato", "Masala"] },
        { name: "Dal Makhani", keywords: ["Dal", "Ghee", "Cream", "Masala"] },
        { name: "Aloo Gobi", keywords: ["Potato", "Cauliflower", "Masala", "Oil"] },
        { name: "Chana Masala", keywords: ["Kabuli Chana", "Onion", "Tomato", "Masala"] },
        { name: "Palak Paneer", keywords: ["Paneer", "Spinach", "Garlic", "Cream"] },
        { name: "Veg Biryani", keywords: ["Basmati Rice", "Vegetables", "Biryani Masala", "Ghee"] },
        { name: "Jeera Rice", keywords: ["Rice", "Jeera", "Ghee"] },
        { name: "Matar Paneer", keywords: ["Paneer", "Peas", "Tomato", "Masala"] }
    ],
    "Italian": [
        { name: "Penne Arrabbiata", keywords: ["Penne", "Pasta Sauce", "Garlic", "Chilli"] },
        { name: "Classic Margherita Pizza", keywords: ["Pizza Base", "Cheese", "Tomato Sauce", "Basil"] },
        { name: "Mushroom Risotto", keywords: ["Rice", "Mushroom", "Cheese", "Butter"] },
        { name: "Spaghetti Aglio e Olio", keywords: ["Spaghetti", "Garlic", "Olive Oil", "Chilli"] },
        { name: "Pasta Primavera", keywords: ["Pasta", "Vegetables", "Olive Oil", "Cheese"] }
    ],
    "Chinese": [
        { name: "Veg Hakka Noodles", keywords: ["Noodles", "Vegetables", "Soy Sauce", "Vinegar"] },
        { name: "Manchurian with Gravy", keywords: ["Vegetables", "Soy Sauce", "Ginger", "Garlic"] },
        { name: "Fried Rice", keywords: ["Rice", "Vegetables", "Soy Sauce", "Oil"] },
        { name: "Spring Rolls", keywords: ["Flour", "Vegetables", "Oil", "Sauce"] }
    ],
    "Mexican": [
        { name: "Veggie Tacos", keywords: ["Taco", "Beans", "Cheese", "Tomato", "Onion"] },
        { name: "Cheese Quesadillas", keywords: ["Tortilla", "Cheese", "Onion", "Chilli"] },
        { name: "Nachos with Salsa", keywords: ["Nachos", "Cheese Sauce", "Tomato", "Onion"] },
        { name: "Enchiladas", keywords: ["Tortilla", "Cheese", "Sauce", "Beans"] }
    ],
    "Korean": [
        { name: "Kimchi Fried Rice", keywords: ["Rice", "Kimchi", "Soy Sauce", "Oil"] },
        { name: "Veg Bibimbap", keywords: ["Rice", "Vegetables", "Chilli Paste", "Soy Sauce"] },
        { name: "Ramen Bowl", keywords: ["Ramen", "Vegetables", "Sauce"] }
    ],
    "Japanese": [
        { name: "Vegetable Sushi", keywords: ["Rice", "Vinegar", "Cucumber", "Carrot"] },
        { name: "Veg Gyoza", keywords: ["Flour", "Cabbage", "Ginger", "Soy Sauce"] },
        { name: "Miso Soup", keywords: ["Miso", "Tofu", "Seaweed"] }
    ],
    "American": [
        { name: "Classic Veg Burger", keywords: ["Burger Bun", "Patty", "Cheese", "Lettuce", "Tomato"] },
        { name: "Mac and Cheese", keywords: ["Macaroni", "Cheese", "Milk", "Butter"] },
        { name: "Garden Salad", keywords: ["Lettuce", "Tomato", "Cucumber", "Dressing"] },
        { name: "French Fries", keywords: ["Potato", "Oil", "Salt"] }
    ],
    "French": [
        { name: "Ratatouille", keywords: ["Tomato", "Onion", "Garlic", "Capsicum"] },
        { name: "Cheese Soufflé", keywords: ["Cheese", "Egg", "Milk", "Butter"] },
        { name: "Vegetable Crepes", keywords: ["Flour", "Milk", "Vegetables", "Cheese"] }
    ],
    "Spanish": [
        { name: "Vegetable Paella", keywords: ["Rice", "Beans", "Tomato", "Saffron"] },
        { name: "Patatas Bravas", keywords: ["Potato", "Oil", "Tomato Sauce"] },
        { name: "Spanish Omelette", keywords: ["Egg", "Potato", "Onion", "Oil"] }
    ],
    "Mediterranean": [
        { name: "Hummus with Pita", keywords: ["Chickpeas", "Garlic", "Olive Oil", "Pita Bread"] },
        { name: "Greek Salad", keywords: ["Cucumber", "Tomato", "Olives", "Cheese"] },
        { name: "Falafel Wrap", keywords: ["Chickpeas", "Wrap", "Cabbage", "Yogurt"] }
    ]
};

async function seedRecipes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB...');

        await Recipe.deleteMany({});
        console.log('Cleared existing recipes.');

        const products = await Product.find();
        console.log(`Analyzing ${products.length} products...`);

        const recipes = [];
        let idCounter = 1;

        const cuisines = Object.keys(recipeTemplates);

        cuisines.forEach(cuisine => {
            const templates = recipeTemplates[cuisine];
            console.log(`Generating 50 recipes for ${cuisine}...`);

            for (let i = 0; i < 50; i++) {
                const template = templates[i % templates.length];

                // Add unique suffix if it's a duplicate template
                const variantSuffix = i >= templates.length ? ` (Var. ${Math.floor(i / templates.length)})` : "";
                const finalName = template.name + variantSuffix;

                const sections = [];
                const ingredients = [];

                template.keywords.forEach(keyword => {
                    const matchedProds = products.filter(p =>
                        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
                        p.category.toLowerCase().includes(keyword.toLowerCase())
                    ).slice(0, 10);

                    if (matchedProds.length > 0) {
                        sections.push({
                            title: `Select ${keyword}`,
                            type: 'radio',
                            options: matchedProds.map(p => ({ productId: p.id, name: p.name }))
                        });

                        // Default ingredient
                        const bestProd = matchedProds.sort((a, b) => (b.stock || 0) - (a.stock || 0))[0];
                        ingredients.push({ productId: bestProd.id, qty: 1 });
                    }
                });

                recipes.push({
                    id: idCounter++,
                    name: finalName,
                    cuisine: cuisine,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
                    isCustomizable: true,
                    sections: sections,
                    ingredients: ingredients
                });
            }
        });

        await Recipe.insertMany(recipes);
        console.log(`Successfully seeded ${recipes.length} REAL recipes!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedRecipes();
