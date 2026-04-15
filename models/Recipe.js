const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    image: { type: String },
    isCustomizable: { type: Boolean, default: true },
    sections: [
        {
            title: String,
            type: { type: String, enum: ['radio', 'checkbox'], default: 'radio' },
            options: [
                {
                    productId: Number,
                    name: String
                }
            ]
        }
    ],
    ingredients: [
        {
            productId: Number,
            qty: Number
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', RecipeSchema);
