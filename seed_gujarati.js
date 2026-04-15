const mongoose = require('mongoose');
const Product = require('./models/Product');
const Recipe = require('./models/Recipe');

async function seedGujarati() {
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

        const gujaratiRecipes = [
            { name: "Dhokla", cuisine: "Gujarati", image: "assets/images/recipes/dhokla.png", ingredients: [{kw:["Besan"],cat:"Atta, Rice & Dal"},{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Turmeric"],cat:"Oil, Ghee & Masala"},{kw:["Green Chilli"],cat:"Vegetables"},{kw:["Mustard"],cat:"Oil, Ghee & Masala"}] },
            { name: "Khandvi", cuisine: "Gujarati", image: "assets/images/recipes/khandvi.png", ingredients: [{kw:["Besan"],cat:"Atta, Rice & Dal"},{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Turmeric"],cat:"Oil, Ghee & Masala"},{kw:["Mustard"],cat:"Oil, Ghee & Masala"},{kw:["Curry Leaves"],cat:"Vegetables"}] },
            { name: "Thepla", cuisine: "Gujarati", image: "assets/images/recipes/thepla.png", ingredients: [{kw:["Atta"],cat:"Atta, Rice & Dal"},{kw:["Fenugreek Leaves"],cat:"Vegetables"},{kw:["Turmeric"],cat:"Oil, Ghee & Masala"},{kw:["Chilli Powder"],cat:"Oil, Ghee & Masala"},{kw:["Yogurt"],cat:"Dairy Products"}] },
            { name: "Undhiyu", cuisine: "Gujarati", image: "assets/images/recipes/undhiyu.png", ingredients: [{kw:["Mix Veg"],cat:"Vegetables"},{kw:["Fenugreek Dumplings"],cat:"Instant Food"},{kw:["Coconut"]}, {kw:["Sesame Seeds"],cat:"Oil, Ghee & Masala"},{kw:["Masala"],cat:"Oil, Ghee & Masala"}] },
            { name: "Fafda", cuisine: "Gujarati", image: "assets/images/recipes/fafda.png", ingredients: [{kw:["Besan"],cat:"Atta, Rice & Dal"},{kw:["Ajwain"],cat:"Oil, Ghee & Masala"},{kw:["Turmeric"],cat:"Oil, Ghee & Masala"},{kw:["Salt"],cat:"Oil, Ghee & Masala"},{kw:["Oil"],cat:"Oil, Ghee & Masala"}] },
            { name: "Handvo", cuisine: "Gujarati", image: "assets/images/recipes/handvo.png", ingredients: [{kw:["Rice"],cat:"Atta, Rice & Dal"},{kw:["Toor Dal"],cat:"Atta, Rice & Dal"},{kw:["Bottle Gourd"],cat:"Vegetables"},{kw:["Sesame Seeds"],cat:"Oil, Ghee & Masala"},{kw:["Mustard"],cat:"Oil, Ghee & Masala"}] },
            { name: "Sev Tameta", cuisine: "Gujarati", image: "assets/images/recipes/sev_tameta.png", ingredients: [{kw:["Tomato"],cat:"Vegetables"},{kw:["Sev"]},{kw:["Onion"],cat:"Vegetables"},{kw:["Garlic"],cat:"Vegetables"},{kw:["Masala"],cat:"Oil, Ghee & Masala"}] },
            { name: "Gujarati Kadhi", cuisine: "Gujarati", image: "assets/images/recipes/gujarati_kadhi.png", ingredients: [{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Besan"],cat:"Atta, Rice & Dal"},{kw:["Curry Leaves"],cat:"Vegetables"},{kw:["Mustard"],cat:"Oil, Ghee & Masala"},{kw:["Sugar"],cat:"Oil, Ghee & Masala"}] },
            { name: "Dal Dhokli", cuisine: "Gujarati", image: "assets/images/recipes/dal_dhokli.png", ingredients: [{kw:["Atta"],cat:"Atta, Rice & Dal"},{kw:["Toor Dal"],cat:"Atta, Rice & Dal"},{kw:["Peanuts"]},{kw:["Masala"],cat:"Oil, Ghee & Masala"}] },
            { name: "Khichdi", cuisine: "Gujarati", image: "assets/images/recipes/khichdi.png", ingredients: [{kw:["Rice"],cat:"Atta, Rice & Dal"},{kw:["Moong Dal"],cat:"Atta, Rice & Dal"},{kw:["Turmeric"],cat:"Oil, Ghee & Masala"},{kw:["Salt"],cat:"Oil, Ghee & Masala"},{kw:["Ghee"],cat:"Oil, Ghee & Masala"}] }
        ];

        let idCounter = 4000;
        for (const r of gujaratiRecipes) {
            const finalIngs = [];
            const sections = [];
            const categorizedOptions = {};

            for (const ing of r.ingredients) {
                const prod = findProd(ing.kw, ing.cat);
                if (prod) {
                    const sectionTitle = ing.cat || "Other Ingredients";
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
                image: r.image,
                isCustomizable: true,
                sections: sections,
                ingredients: finalIngs
            };

            await Recipe.findOneAndUpdate({ name: r.name }, recipeDoc, { upsert: true });
            console.log(`Saved/Updated: ${r.name}`);
        }

        console.log('✅ Gujarati recipes added!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedGujarati();
