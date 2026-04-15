const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // ... (rest of schema same)
    // Auth Fields
    name: { type: String, default: "User" },
    phone: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: {
        type: String,
        validate: {
            validator: function (v) {
                // Only validate if it's being set (not empty) and not already hashed (starts with $2a$ or $2b$)
                if (!v || v.startsWith('$2a$') || v.startsWith('$2b$')) return true;
                return v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);
            },
            message: props => "Password must be 8+ chars and contain at least one uppercase letter, one number, and one special character."
        }
    },


    // Store multiple saved addresses
    savedAddresses: [{
        id: Number,
        addressType: { type: String, default: 'Home' }, // Renamed from 'type' to avoid Mongoose conflict
        fullName: String,
        mobile: String,
        pincode: String,
        houseNo: String,
        area: String,
        landmark: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        isDefault: { type: Boolean, default: false },
        text: String
    }],

    // Store cart for persistence
    savedCart: { type: Object, default: {} },

    // Store Order History
    orderHistory: [{ type: Object }],

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
}, { versionKey: false });

// PRE-SAVE HOOK: Hash Password
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
