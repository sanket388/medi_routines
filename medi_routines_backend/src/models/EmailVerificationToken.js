const mongoose = require('mongoose');

// This model stores email verification tokens.
// One token per user at a time (userId is unique).
// Token is stored unhashed — it's cryptographically random and short-lived (24h).

const emailVerificationTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // only one active token per user
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);

module.exports = EmailVerificationToken;
