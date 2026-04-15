const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');
require('dotenv').config();

const recipes = [
    {
        id: 5010,
        name: "Tomato Garlic Pasta",
        cuisine: "Italian",
        image: "assets/images/recipes/tomato-garlic-pasta.jpg",
        ingredients: [
            { productId: 31, qty: 1 }, // Tomato
            { productId: 44, qty: 1 }, // Garlic
            { productId: 32, qty: 1 }, // Onion
            { productId: 1069, qty: 1 } // Pasta
        ]
    },
    {
        id: 5011,
        name: "Vegetable White Sauce Pasta",
        cuisine: "Italian",
        image: "assets/images/recipes/veg-white-pasta.jpg",
        ingredients: [
            { productId: 37, qty: 1 }, // Carrot
            { productId: 39, qty: 1 }, // Capsicum
            { productId: null, qty: 1 }, // Broccoli (Placeholder)
            { productId: 93, qty: 1 }, // Milk
            { productId: 338, qty: 1 }, // Flour (Maida)
            { productId: 1069, qty: 1 } // Pasta
        ]
    },
    {
        id: 5012,
        name: "Mushroom Garlic Pasta",
        cuisine: "Italian",
        image: "assets/images/recipes/mushroom-garlic-pasta.jpg",
        ingredients: [
            { productId: 47, qty: 1 }, // Mushroom
            { productId: 44, qty: 1 }, // Garlic
            { productId: 32, qty: 1 }, // Onion
            { productId: 1069, qty: 1 } // Pasta
        ]
    },
    {
        id: 5013,
        name: "Spinach Pasta",
        cuisine: "Italian",
        image: "assets/images/recipes/spinach-pasta.jpg",
        ingredients: [
            { productId: 41, qty: 1 }, // Spinach
            { productId: 44, qty: 1 }, // Garlic
            { productId: 1069, qty: 1 } // Pasta
        ]
    },
    {
        id: 5014,
        name: "Veg Pizza (Homemade)",
        cuisine: "Italian",
        image: "assets/images/recipes/veg-pizza.jpg",
        ingredients: [
            { productId: 31, qty: 1 }, // Tomato
            { productId: 32, qty: 1 }, // Onion
            { productId: 39, qty: 1 }, // Capsicum
            { productId: 47, qty: 1 }, // Mushroom
            { productId: 338, qty: 1 } // Flour (Maida)
        ]
    },
    {
        id: 5015,
        name: "Tomato Soup",
        cuisine: "Italian",
        image: "assets/images/recipes/tomato-soup.jpg",
        ingredients: [
            { productId: 31, qty: 1 }, // Tomato
            { productId: 44, qty: 1 }  // Garlic
        ]
    },
    {
        id: 5016,
        name: "Stuffed Capsicum",
        cuisine: "Italian",
        image: "assets/images/recipes/stuffed-capsicum.jpg",
        ingredients: [
            { productId: 39, qty: 1 }, // Capsicum
            { productId: 32, qty: 1 }, // Onion
            { productId: 31, qty: 1 }, // Tomato
            { productId: 33, qty: 1 }  // Potato
        ]
    },
    {
        id: 5017,
        name: "Bruschetta (Indian Style)",
        cuisine: "Italian",
        image: "assets/images/recipes/bruschetta.jpg",
        ingredients: [
            { productId: 31, qty: 1 }, // Tomato
            { productId: 32, qty: 1 }, // Onion
            { productId: 35, qty: 1 }, // Coriander
            { productId: 1608, qty: 1 } // Bread
        ]
    },
    {
        id: 5018,
        name: "Garlic Bread",
        cuisine: "Italian",
        image: "assets/images/recipes/garlic-bread.jpg",
        ingredients: [
            { productId: 44, qty: 1 }, // Garlic
            { productId: 123, qty: 1 }, // Butter
            { productId: 1608, qty: 1 } // Bread
        ]
    },
    {
        id: 5019,
        name: "Vegetable Risotto (Simple)",
        cuisine: "Italian",
        image: "assets/images/recipes/risotto.jpg",
        ingredients: [
            { productId: 270, qty: 1 }, // Rice (Black Rice used as base)
            { productId: 47, qty: 1 }, // Mushroom
            { productId: 37, qty: 1 }, // Carrot
            { productId: 42, qty: 1 }  // Peas
        ]
    },
    {
        id: 5020,
        name: "Spinach Mushroom Stir",
        cuisine: "Italian",
        image: "assets/images/recipes/spinach-mushroom.jpg",
        ingredients: [
            { productId: 41, qty: 1 }, // Spinach
            { productId: 47, qty: 1 }, // Mushroom
            { productId: 44, qty: 1 }  // Garlic
        ]
    },
    {
        id: 5021,
        name: "Baked Vegetables",
        cuisine: "Italian",
        image: "assets/images/recipes/baked-veg.jpg",
        ingredients: [
            { productId: 37, qty: 1 }, // Carrot
            { productId: 39, qty: 1 }, // Capsicum
            { productId: null, qty: 1 }, // Broccoli (Placeholder)
            { productId: 45, qty: 1 }  // Cauliflower
        ]
    },
    {
        id: 5022,
        name: "Tomato Onion Flatbread",
        cuisine: "Italian",
        image: "assets/images/recipes/flatbread.jpg",
        ingredients: [
            { productId: 31, qty: 1 }, // Tomato
            { productId: 32, qty: 1 }, // Onion
            { productId: null, qty: 1 }  // Flatbread (Placeholder)
        ]
    },
    {
        id: 5023,
        name: "Lemon Garlic Veg Stir",
        cuisine: "Italian",
        image: "assets/images/recipes/lemon-garlic-stir.jpg",
        ingredients: [
            { productId: 34, qty: 1 }, // Lemon
            { productId: 44, qty: 1 }, // Garlic
            { productId: null, qty: 1 }  // Vegetables (Placeholder)
        ]
    },
    {
        id: 5024,
        name: "Fruit Salad",
        cuisine: "Italian",
        image: "assets/images/recipes/fruit-salad.jpg",
        ingredients: [
            { productId: 1, qty: 1 }, // Apple
            { productId: 6, qty: 1 }, // Banana
            { productId: 10, qty: 1 }, // Grapes
            { productId: 11, qty: 1 }  // Strawberry
        ]
    }
];

async function seedRecipes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        console.log("Connected to MongoDB");

        for (const recipeData of recipes) {
            await Recipe.findOneAndUpdate(
                { id: recipeData.id },
                recipeData,
                { upsert: true, new: true }
            );
        }

        console.log(`Successfully seeded ${recipes.length} Italian recipes.`);
    } catch (err) {
        console.error("Error seeding recipes:", err);
    } finally {
        await mongoose.disconnect();
    }
}

seedRecipes();
