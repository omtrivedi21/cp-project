const mongoose = require('mongoose');
const Product = require('./models/Product');
const Recipe = require('./models/Recipe');

async function seedSouthIndian() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        const findProd = (kw, cat) => {
            const p = products.find(prod => {
                const name = prod.name.toLowerCase();
                const match = kw.every(k => name.includes(k.toLowerCase()));
                if (cat) return match && prod.category === cat;
                return match;
            });
            return p ? { productId: p.id, name: p.name } : null;
        };

        const southIndianRecipes = [
            {
                name: "Idli",
                cuisine: "South Indian",
                image: "assets/images/recipes/idli.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Urad Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Salt"], cat: "Oil, Ghee & Masala" }
                ]
            },
            {
                name: "Plain Dosa",
                cuisine: "South Indian",
                image: "assets/images/recipes/plain_dosa.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Urad Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Fenugreek"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Salt"], cat: "Oil, Ghee & Masala" }
                ]
            },
            {
                name: "Medu Vada",
                cuisine: "South Indian",
                image: "assets/images/recipes/medu_vada.png",
                ingredients: [
                    { kw: ["Urad Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Black Pepper"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Curry Leaves"], cat: "Vegetables" },
                    { kw: ["Ginger"], cat: "Vegetables" },
                    { kw: ["Salt"], cat: "Oil, Ghee & Masala" }
                ]
            },
            {
                name: "Uttapam",
                cuisine: "South Indian",
                image: "assets/images/recipes/uttapam.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Urad Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Onion"], cat: "Vegetables" },
                    { kw: ["Tomato"], cat: "Vegetables" },
                    { kw: ["Green Chilli"], cat: "Vegetables" }
                ]
            },
            {
                name: "Rasam",
                cuisine: "South Indian",
                image: "assets/images/recipes/rasam.png",
                ingredients: [
                    { kw: ["Tamarind"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Tomato"], cat: "Vegetables" },
                    { kw: ["Garlic"], cat: "Vegetables" },
                    { kw: ["Black Pepper"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Cumin"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Curry Leaves"], cat: "Vegetables" }
                ]
            },
            {
                name: "Sambar",
                cuisine: "South Indian",
                image: "assets/images/recipes/sambar.png",
                ingredients: [
                    { kw: ["Toor Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Tamarind"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Mix Veg"], cat: "Vegetables" },
                    { kw: ["Sambar Powder"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Curry Leaves"], cat: "Vegetables" }
                ]
            },
            {
                name: "Curd Rice",
                cuisine: "South Indian",
                image: "assets/images/recipes/curd_rice.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Yogurt"], cat: "Dairy Products" },
                    { kw: ["Mustard seeds"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Curry Leaves"], cat: "Vegetables" },
                    { kw: ["Green Chilli"], cat: "Vegetables" }
                ]
            },
            {
                name: "Pongal",
                cuisine: "South Indian",
                image: "assets/images/recipes/pongal.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Moong Dal"], cat: "Atta, Rice & Dal" },
                    { kw: ["Black Pepper"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Cumin"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Ghee"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Ginger"], cat: "Vegetables" }
                ]
            },
            {
                name: "Upma",
                cuisine: "South Indian",
                image: "assets/images/recipes/upma.png",
                ingredients: [
                    { kw: ["Rava"], cat: "Atta, Rice & Dal" },
                    { kw: ["Mustard seeds"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Curry Leaves"], cat: "Vegetables" },
                    { kw: ["Onion"], cat: "Vegetables" },
                    { kw: ["Green Chilli"], cat: "Vegetables" }
                ]
            },
            {
                name: "Appam",
                cuisine: "South Indian",
                image: "assets/images/recipes/appam.png",
                ingredients: [
                    { kw: ["Rice"], cat: "Atta, Rice & Dal" },
                    { kw: ["Coconut Milk"], cat: "Dairy Products" },
                    { kw: ["Sugar"], cat: "Oil, Ghee & Masala" },
                    { kw: ["Yeast"], cat: "Instant Food" },
                    { kw: ["Salt"], cat: "Oil, Ghee & Masala" }
                ]
            }
        ];

        let idCounter = 3000;
        for (const r of southIndianRecipes) {
            const finalIngs = [];
            const sections = [];
            const categorizedOptions = {};

            for (const ing of r.ingredients) {
                const prod = findProd(ing.kw, ing.cat);
                if (prod) {
                    const sectionTitle = ing.cat;
                    if (!categorizedOptions[sectionTitle]) categorizedOptions[sectionTitle] = [];
                    categorizedOptions[sectionTitle].push({ productId: prod.productId, name: prod.name });
                    finalIngs.push({ productId: prod.productId, qty: 1 });
                }
            }

            for (const [title, options] of Object.entries(categorizedOptions)) {
                sections.push({ title: title, type: 'radio', options: options });
            }

            const recipeDoc = {
                id: idCounter++,
                name: r.name,
                cuisine: r.cuisine,
                image: r.image, // Using placeholder/generic name for now
                isCustomizable: true,
                sections: sections,
                ingredients: finalIngs
            };

            await Recipe.findOneAndUpdate({ name: r.name }, recipeDoc, { upsert: true });
            console.log(`Saved/Updated: ${r.name}`);
        }

        console.log('✅ South Indian recipes added!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedSouthIndian();
