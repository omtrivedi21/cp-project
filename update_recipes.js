const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

async function updateRecipes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        console.log('Connected to MongoDB');

        // 1. Remove recipes with "Type 2" or "Type 3"
        const deleteResult = await Recipe.deleteMany({
            name: { $regex: /Type/i }
        });
        console.log(`Deleted ${deleteResult.deletedCount} placeholder recipes.`);

        // 2. Define new distinct recipes
        const newRecipes = [
            {
                id: 11,
                name: "Shahi Paneer",
                cuisine: "North Indian",
                image: "assets/images/shahi_paneer.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredient",
                        type: "radio",
                        options: [
                            { productId: 146, name: "Amul Fresh Malai Paneer" },
                            { productId: 147, name: "Gowardhan Paneer Block" }
                        ]
                    },
                    {
                        title: "Gravy Base",
                        type: "checkbox",
                        options: [
                            { productId: 31, name: "Tomato" },
                            { productId: 32, name: "Onion" },
                            { productId: 100, name: "Curd (Masti Pouch)" }
                        ]
                    },
                    {
                        title: "Dairy & Fats",
                        type: "radio",
                        options: [
                            { productId: 123, name: "Amul Salted Butter" },
                            { productId: 376, name: "Amul Cow Ghee" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 387, name: "Everest Garam Masala" },
                            { productId: 384, name: "Everest Red Chilli Powder" },
                            { productId: 385, name: "Everest Turmeric Powder" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 100, qty: 1 },
                    { productId: 376, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 } // Salt
                ]
            },
            {
                id: 12,
                name: "Dal Makhani",
                cuisine: "North Indian",
                image: "assets/images/dal_makhani.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Dal",
                        type: "checkbox",
                        options: [
                            { productId: 310, name: "Tata Sampann Chana Dal" },
                            { productId: 279, name: "Tata Sampann Toor Dal" }
                        ]
                    },
                    {
                        title: "Dairy",
                        type: "checkbox",
                        options: [
                            { productId: 123, name: "Amul Salted Butter" },
                            { productId: 87, name: "Amul Gold Cream Milk" }
                        ]
                    },
                    {
                        title: "Aromatics",
                        type: "checkbox",
                        options: [
                            { productId: 38, name: "Ginger" },
                            { productId: 44, name: "Garlic" },
                            { productId: 32, name: "Onion" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 310, qty: 1 },
                    { productId: 123, qty: 1 },
                    { productId: 87, qty: 1 },
                    { productId: 38, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 13,
                name: "Aloo Gobi",
                cuisine: "North Indian",
                image: "assets/images/aloo_gobi.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Veggies",
                        type: "checkbox",
                        options: [
                            { productId: 33, name: "Potato" },
                            { productId: 45, name: "Cauliflower" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 385, name: "Everest Turmeric Powder" },
                            { productId: 384, name: "Everest Red Chilli Powder" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 33, qty: 1 },
                    { productId: 45, qty: 1 },
                    { productId: 385, qty: 1 },
                    { productId: 415, qty: 1 },
                    { productId: 358, qty: 1 } // Sunflower Oil
                ]
            },
            {
                id: 14,
                name: "Bhindi Masala",
                cuisine: "North Indian",
                image: "assets/images/bhindi_masala.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Veggie",
                        type: "radio",
                        options: [
                            { productId: 49, name: "Lady Finger (Bhindi)" }
                        ]
                    },
                    {
                        title: "Spices & Base",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 386, name: "Everest Coriander Powder" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 49, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 386, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 15,
                name: "Mushroom Masala",
                cuisine: "Indian",
                image: "assets/images/mushroom_masala.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Mushroom",
                        type: "radio",
                        options: [
                            { productId: 47, name: "Button Mushroom" }
                        ]
                    },
                    {
                        title: "Gravy Base",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 44, name: "Garlic" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 47, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 16,
                name: "Jeera Rice",
                cuisine: "Indian",
                image: "assets/images/jeera_rice.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Rice",
                        type: "radio",
                        options: [
                            { productId: 229, name: "India Gate Classic Basmati Rice" }
                        ]
                    },
                    {
                        title: "Tadka",
                        type: "checkbox",
                        options: [
                            { productId: 376, name: "Amul Cow Ghee" },
                            { productId: 404, name: "Whole Cumin Seeds" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 229, qty: 1 },
                    { productId: 376, qty: 1 },
                    { productId: 404, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 17,
                name: "Matar Paneer",
                cuisine: "North Indian",
                image: "assets/images/matar_paneer.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Veggies",
                        type: "checkbox",
                        options: [
                            { productId: 146, name: "Amul Paneer" },
                            { productId: 42, name: "Green Peas" }
                        ]
                    },
                    {
                        title: "Base",
                        type: "checkbox",
                        options: [
                            { productId: 31, name: "Tomato" },
                            { productId: 32, name: "Onion" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 42, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 1,
                name: "Paneer Butter Masala",
                cuisine: "North Indian",
                image: "assets/images/paneer_butter_masala.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredient",
                        type: "radio",
                        options: [
                            { productId: 146, name: "Amul Fresh Malai Paneer" }
                        ]
                    },
                    {
                        title: "Dairy",
                        type: "checkbox",
                        options: [
                            { productId: 123, name: "Amul Salted Butter" },
                            { productId: 100, name: "Amul Fresh Cream" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 123, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 18,
                name: "Veg Biryani",
                cuisine: "Hyderabadi",
                image: "assets/images/veg_biryani.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Rice",
                        type: "radio",
                        options: [
                            { productId: 229, name: "India Gate Basmati Rice" }
                        ]
                    },
                    {
                        title: "Veggies",
                        type: "checkbox",
                        options: [
                            { productId: 33, name: "Potato" },
                            { productId: 42, name: "Green Peas" },
                            { productId: 45, name: "Cauliflower" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 229, qty: 1 },
                    { productId: 33, qty: 1 },
                    { productId: 42, qty: 1 },
                    { productId: 376, qty: 1 }
                ]
            },
            {
                id: 4,
                name: "Chana Masala",
                cuisine: "North Indian",
                image: "assets/images/chana_masala.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Protein",
                        type: "radio",
                        options: [
                            { productId: 310, name: "Tata Sampann Chana Dal" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 310, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 387, qty: 1 }
                ]
            },
            {
                id: 5,
                name: "Palak Paneer",
                cuisine: "North Indian",
                image: "assets/images/palak_paneer.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 146, name: "Paneer" },
                            { productId: 41, name: "Spinach" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 41, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 10,
                name: "Kadai Paneer",
                cuisine: "North Indian",
                image: "assets/images/kadai_paneer.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 146, name: "Paneer" },
                            { productId: 39, name: "Capsicum" },
                            { productId: 32, name: "Onion" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 39, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 }
                ]
            },
            {
                id: 19,
                name: "Bedmi Puri",
                cuisine: "North Indian",
                image: "assets/images/bedmi_puri.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Flour & Dal",
                        type: "checkbox",
                        options: [
                            { productId: 185, name: "Aashirvaad Whole Wheat Atta" },
                            { productId: 288, name: "Tata Sampann Urad Dal" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 404, name: "Whole Cumin Seeds" },
                            { productId: 386, name: "Everest Coriander Powder" },
                            { productId: 384, name: "Everest Red Chilli Powder" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 185, qty: 1 },
                    { productId: 288, qty: 1 },
                    { productId: 404, qty: 1 },
                    { productId: 386, qty: 1 },
                    { productId: 384, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 20,
                name: "Aloo Tamatar Sabzi",
                cuisine: "North Indian",
                image: "assets/images/aloo_tamatar.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Veggies",
                        type: "checkbox",
                        options: [
                            { productId: 33, name: "Potato" },
                            { productId: 31, name: "Tomato" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 404, name: "Whole Cumin Seeds" },
                            { productId: 385, name: "Everest Turmeric Powder" },
                            { productId: 386, name: "Everest Coriander Powder" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 33, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 404, qty: 1 },
                    { productId: 385, qty: 1 },
                    { productId: 386, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 21,
                name: "Kachori",
                cuisine: "North Indian",
                image: "assets/images/kachori.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Dough & Filling",
                        type: "checkbox",
                        options: [
                            { productId: 338, name: "Maida" },
                            { productId: 282, name: "Tata Sampann Moong Dal" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 414, name: "Hing Powder" },
                            { productId: 404, name: "Whole Cumin Seeds" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 338, qty: 1 },
                    { productId: 282, qty: 1 },
                    { productId: 414, qty: 1 },
                    { productId: 404, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 22,
                name: "Methi Malai Matar",
                cuisine: "North Indian",
                image: "assets/images/methi_malai_matar.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 413, name: "Kasuri Methi" },
                            { productId: 42, name: "Green Peas" },
                            { productId: 87, name: "Amul Gold Cream Milk" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 413, qty: 1 },
                    { productId: 42, qty: 1 },
                    { productId: 87, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 23,
                name: "Shahi Tukda",
                cuisine: "North Indian",
                image: "assets/images/shahi_tukda.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 1576, name: "Britannia White Bread" },
                            { productId: 87, name: "Amul Gold Full Cream Milk" },
                            { productId: 420, name: "Madhur Pure Sugar" }
                        ]
                    },
                    {
                        title: "Dry Fruits",
                        type: "checkbox",
                        options: [
                            { productId: 1204, name: "California Almonds" },
                            { productId: 1206, name: "W240 Cashew Nuts" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 1576, qty: 1 },
                    { productId: 87, qty: 1 },
                    { productId: 420, qty: 1 },
                    { productId: 1204, qty: 1 },
                    { productId: 1206, qty: 1 }
                ]
            },
            {
                id: 24,
                name: "Paneer Bhurji",
                cuisine: "Punjabi",
                image: "assets/images/paneer_bhurji.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Protein",
                        type: "radio",
                        options: [
                            { productId: 146, name: "Amul Fresh Malai Paneer" }
                        ]
                    },
                    {
                        title: "Aromatics & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 36, name: "Green Chilli" },
                            { productId: 38, name: "Ginger" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 36, qty: 1 },
                    { productId: 38, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 25,
                name: "Aloo Kulcha",
                cuisine: "Punjabi",
                image: "assets/images/aloo_kulcha.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Dough",
                        type: "radio",
                        options: [
                            { productId: 338, name: "Maida" }
                        ]
                    },
                    {
                        title: "Filling & Topping",
                        type: "checkbox",
                        options: [
                            { productId: 33, name: "Potato" },
                            { productId: 32, name: "Onion" },
                            { productId: 386, name: "Coriander" },
                            { productId: 123, name: "Amul Salted Butter" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 338, qty: 1 },
                    { productId: 33, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 386, qty: 1 },
                    { productId: 123, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 26,
                name: "Dal Tadka",
                cuisine: "Punjabi",
                image: "assets/images/dal_tadka.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Dal",
                        type: "radio",
                        options: [
                            { productId: 279, name: "Tata Sampann Toor Dal" }
                        ]
                    },
                    {
                        title: "Tadka",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 44, name: "Garlic" },
                            { productId: 404, name: "Whole Cumin Seeds" },
                            { productId: 376, name: "Amul Cow Ghee" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 279, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 404, qty: 1 },
                    { productId: 376, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 27,
                name: "Methi Malai Paneer",
                cuisine: "Punjabi",
                image: "assets/images/methi_malai_paneer.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 146, name: "Amul Fresh Malai Paneer" },
                            { productId: 413, name: "Kasuri Methi" },
                            { productId: 87, name: "Amul Gold Cream Milk" }
                        ]
                    },
                    {
                        title: "Spices",
                        type: "checkbox",
                        options: [
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 146, qty: 1 },
                    { productId: 413, qty: 1 },
                    { productId: 87, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 28,
                name: "Amritsari Chole",
                cuisine: "Punjabi",
                image: "assets/images/amritsari_chole.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Protein",
                        type: "radio",
                        options: [
                            { productId: 285, name: "Tata Sampann Kabuli Chana" }
                        ]
                    },
                    {
                        title: "Gravy Base & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 38, name: "Ginger" },
                            { productId: 44, name: "Garlic" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 285, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 38, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 29,
                name: "Patra",
                cuisine: "Gujarati",
                image: "assets/images/patra.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Dough & Coating",
                        type: "radio",
                        options: [
                            { productId: 334, name: "Besan" }
                        ]
                    },
                    {
                        title: "Flavors & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 20, name: "Sweet Tamarind" },
                            { productId: 426, name: "Solid Jaggery (Gur)" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 334, qty: 1 },
                    { productId: 20, qty: 1 },
                    { productId: 426, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 30,
                name: "Sev Khamani",
                cuisine: "Gujarati",
                image: "assets/images/sev_khamani.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 310, name: "Tata Sampann Chana Dal" },
                            { productId: 875, name: "Garden Nylon Sev" }
                        ]
                    },
                    {
                        title: "Tadka & Flavors",
                        type: "checkbox",
                        options: [
                            { productId: 406, name: "Whole Mustard Seeds" },
                            { productId: 53, name: "Curry Leaves" },
                            { productId: 36, name: "Green Chilli" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 310, qty: 1 },
                    { productId: 875, qty: 1 },
                    { productId: 406, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 36, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 31,
                name: "Ringan no Olo",
                cuisine: "Gujarati",
                image: "assets/images/ringan_no_olo.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Vegetable",
                        type: "radio",
                        options: [
                            { productId: 62, name: "Brinjal" }
                        ]
                    },
                    {
                        title: "Aromatics & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 32, name: "Onion" },
                            { productId: 31, name: "Tomato" },
                            { productId: 44, name: "Garlic" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 62, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 44, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 32,
                name: "Batata nu Shaak",
                cuisine: "Gujarati",
                image: "assets/images/batata_nu_shaak.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Vegetable",
                        type: "radio",
                        options: [
                            { productId: 33, name: "Potato" }
                        ]
                    },
                    {
                        title: "Tadka & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 406, name: "Whole Mustard Seeds" },
                            { productId: 385, name: "Everest Turmeric Powder" },
                            { productId: 53, name: "Curry Leaves" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 33, qty: 1 },
                    { productId: 406, qty: 1 },
                    { productId: 385, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 33,
                name: "Mohanthal",
                cuisine: "Gujarati",
                image: "assets/images/mohanthal.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 334, name: "Besan" },
                            { productId: 376, name: "Amul Cow Ghee" },
                            { productId: 420, name: "Madhur Pure Sugar" },
                            { productId: 408, name: "Green Cardamom" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 334, qty: 1 },
                    { productId: 376, qty: 1 },
                    { productId: 420, qty: 1 },
                    { productId: 408, qty: 1 }
                ]
            },
            {
                id: 34,
                name: "Lemon Rice",
                cuisine: "South Indian",
                image: "assets/images/lemon_rice.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Rice Base",
                        type: "radio",
                        options: [
                            { productId: 229, name: "India Gate Basmati Rice" }
                        ]
                    },
                    {
                        title: "Tadka & Flavors",
                        type: "checkbox",
                        options: [
                            { productId: 34, name: "Lemon" },
                            { productId: 406, name: "Whole Mustard Seeds" },
                            { productId: 53, name: "Curry Leaves" },
                            { productId: 935, name: "Roasted Peanuts" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 229, qty: 1 },
                    { productId: 34, qty: 1 },
                    { productId: 406, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 935, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 35,
                name: "Coconut Chutney",
                cuisine: "South Indian",
                image: "assets/images/coconut_chutney.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 22, name: "Coconut" },
                            { productId: 903, name: "Roasted Chana Dal" },
                            { productId: 36, name: "Green Chilli" }
                        ]
                    },
                    {
                        title: "Tadka",
                        type: "checkbox",
                        options: [
                            { productId: 406, name: "Whole Mustard Seeds" },
                            { productId: 53, name: "Curry Leaves" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 22, qty: 1 },
                    { productId: 903, qty: 1 },
                    { productId: 36, qty: 1 },
                    { productId: 406, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 36,
                name: "Tomato Rice",
                cuisine: "South Indian",
                image: "assets/images/tomato_rice.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Rice Base",
                        type: "radio",
                        options: [
                            { productId: 229, name: "India Gate Basmati Rice" }
                        ]
                    },
                    {
                        title: "Veggies & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 31, name: "Tomato" },
                            { productId: 32, name: "Onion" },
                            { productId: 406, name: "Whole Mustard Seeds" },
                            { productId: 53, name: "Curry Leaves" },
                            { productId: 387, name: "Everest Garam Masala" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 229, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 32, qty: 1 },
                    { productId: 406, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 37,
                name: "Vegetable Sambar",
                cuisine: "South Indian",
                image: "assets/images/vegetable_sambar.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 279, name: "Tata Sampann Toor Dal" },
                            { productId: 33, name: "Potato" },
                            { productId: 31, name: "Tomato" }
                        ]
                    },
                    {
                        title: "Tadka & Spices",
                        type: "checkbox",
                        options: [
                            { productId: 20, name: "Sweet Tamarind" },
                            { productId: 387, name: "Everest Garam Masala" },
                            { productId: 53, name: "Curry Leaves" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 279, qty: 1 },
                    { productId: 33, qty: 1 },
                    { productId: 31, qty: 1 },
                    { productId: 20, qty: 1 },
                    { productId: 387, qty: 1 },
                    { productId: 53, qty: 1 },
                    { productId: 415, qty: 1 }
                ]
            },
            {
                id: 38,
                name: "Rava Kesari",
                cuisine: "South Indian",
                image: "assets/images/rava_kesari.jpg",
                isCustomizable: true,
                sections: [
                    {
                        title: "Main Ingredients",
                        type: "checkbox",
                        options: [
                            { productId: 336, name: "Sooji (Rava)" },
                            { productId: 420, name: "Madhur Pure Sugar" },
                            { productId: 376, name: "Amul Cow Ghee" }
                        ]
                    },
                    {
                        title: "Dry Fruits",
                        type: "checkbox",
                        options: [
                            { productId: 1206, name: "W240 Cashew Nuts" }
                        ]
                    }
                ],
                ingredients: [
                    { productId: 336, qty: 1 },
                    { productId: 420, qty: 1 },
                    { productId: 376, qty: 1 },
                    { productId: 1206, qty: 1 }
                ]
            }
        ];

        // 3. Add new recipes if they don't exist (using id as check)
        for (const recipeData of newRecipes) {
            await Recipe.findOneAndUpdate(
                { id: recipeData.id },
                recipeData,
                { upsert: true, new: true }
            );
            console.log(`Added/Updated recipe: ${recipeData.name}`);
        }

        console.log('Recipe update completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating recipes:', err);
        process.exit(1);
    }
}

updateRecipes();
