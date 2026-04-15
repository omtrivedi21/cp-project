const mongoose = require('mongoose');
const Product = require('./models/Product');
const Recipe = require('./models/Recipe');

async function seedPunjabi() {
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

        const punjabiRecipes = [
            { name: "Chole Bhature", cuisine: "Punjabi", image: "assets/images/recipes/chole_bhature.png", ingredients: [{kw:["Kabuli Chana"],cat:"Atta, Rice & Dal"},{kw:["Maida"],cat:"Atta, Rice & Dal"},{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Everest Garam Masala"],cat:"Oil, Ghee & Masala"},{kw:["Oil"],cat:"Oil, Ghee & Masala"}] },
            { name: "Rajma Chawal", cuisine: "Punjabi", image: "assets/images/recipes/rajma_chawal.png", ingredients: [{kw:["Rajma"],cat:"Atta, Rice & Dal"},{kw:["Basmati Rice"],cat:"Atta, Rice & Dal"},{kw:["Onion"],cat:"Vegetables"},{kw:["Tomato"],cat:"Vegetables"},{kw:["Ghee"],cat:"Oil, Ghee & Masala"}] },
            { name: "Paneer Tikka", cuisine: "Punjabi", image: "assets/images/recipes/paneer_tikka.png", ingredients: [{kw:["Paneer"],cat:"Dairy Products"},{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Capsicum"],cat:"Vegetables"},{kw:["Onion"],cat:"Vegetables"},{kw:["Chat Masala"],cat:"Oil, Ghee & Masala"}] },
            { name: "Makki di Roti", cuisine: "Punjabi", image: "assets/images/recipes/makki_di_roti.png", ingredients: [{kw:["Makki Atta"],cat:"Atta, Rice & Dal"},{kw:["Ghee"],cat:"Oil, Ghee & Masala"},{kw:["Butter"],cat:"Dairy Products"},{kw:["Salt"],cat:"Oil, Ghee & Masala"}] },
            { name: "Sarson da Saag", cuisine: "Punjabi", image: "assets/images/recipes/sarson_da_saag.png", ingredients: [{kw:["Mustard Leaves"],cat:"Vegetables"},{kw:["Spinach"],cat:"Vegetables"},{kw:["Ginger"],cat:"Vegetables"},{kw:["Garlic"],cat:"Vegetables"},{kw:["Green Chilli"],cat:"Vegetables"}] },
            { name: "Aloo Paratha", cuisine: "Punjabi", image: "assets/images/recipes/aloo_paratha.png", ingredients: [{kw:["Atta"],cat:"Atta, Rice & Dal"},{kw:["Potato"],cat:"Vegetables"},{kw:["Butter"],cat:"Dairy Products"},{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Green Chilli"],cat:"Vegetables"}] },
            { name: "Malai Kofta", cuisine: "Punjabi", image: "assets/images/recipes/malai_kofta.png", ingredients: [{kw:["Paneer"],cat:"Dairy Products"},{kw:["Potato"],cat:"Vegetables"},{kw:["Fresh Cream"],cat:"Dairy Products"},{kw:["Cashew"],cat:"Dryfruit & Cereals"},{kw:["Tomato"],cat:"Vegetables"}] },
            { name: "Butter Paneer", cuisine: "Punjabi", image: "assets/images/recipes/butter_paneer.png", ingredients: [{kw:["Paneer"],cat:"Dairy Products"},{kw:["Butter"],cat:"Dairy Products"},{kw:["Fresh Cream"],cat:"Dairy Products"},{kw:["Tomato"],cat:"Vegetables"},{kw:["Kasuri Methi"],cat:"Oil, Ghee & Masala"}] },
            { name: "Amritsari Kulcha", cuisine: "Punjabi", image: "assets/images/recipes/amritsari_kulcha.png", ingredients: [{kw:["Maida"],cat:"Atta, Rice & Dal"},{kw:["Potato"],cat:"Vegetables"},{kw:["Butter"],cat:"Dairy Products"},{kw:["Ajwain"],cat:"Oil, Ghee & Masala"},{kw:["Salt"],cat:"Oil, Ghee & Masala"}] },
            { name: "Punjabi Lassi", cuisine: "Punjabi", image: "assets/images/recipes/punjabi_lassi.png", ingredients: [{kw:["Yogurt"],cat:"Dairy Products"},{kw:["Sugar"],cat:"Oil, Ghee & Masala"},{kw:["Cardamom"],cat:"Oil, Ghee & Masala"}] }
        ];

        let idCounter = 5000;
        for (const r of punjabiRecipes) {
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

        console.log('✅ Punjabi recipes added!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedPunjabi();
