const mongoose = require('mongoose');

// This model stores forgot password tokens.
// One active token per user is allowed at a time.
// Token is stored unhashed because it is random and expires quickly.

const forgotPasswordTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
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

const ForgotPasswordToken = mongoose.model('ForgotPasswordToken', forgotPasswordTokenSchema);

module.exports = ForgotPasswordToken;
