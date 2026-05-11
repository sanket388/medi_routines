const mongoose = require('mongoose');

// This model represents users in the database.

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // password is not required because user can sign up with google
    password: { type: String, required: false },

    // user's timezone
    timezone: { type: String, required: true },

    // user's own created routines, will only store the ids (just like foreign key in rdbms)
    // another way can be to store complete list of the routines, but if frequent updations are there, then performance issues can occur
    // since with each update on routine, need to update on user too
    routines : [{type: mongoose.Schema.Types.ObjectId, ref: 'Routine'}],
    // user's own defined medicines
    userDefinedMedicines: [{type: mongoose.Schema.Types.ObjectId, ref:'UserDefinedMedicine'}],
    fcmTokens: [{type:String}],  // for push notifications
    isEmailVerified: { type: Boolean, required: true, default: false },
    // to support multiple auth providers
    authProviders: [{type: String, enum: ["local", "google"]}],
    // google id of the user, if signed up with google
    googleId: { type: String, required: false, unique: true, sparse: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;