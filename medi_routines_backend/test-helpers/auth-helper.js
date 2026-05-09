const request = require('supertest');
const User = require('../src/models/User');
const EmailVerificationToken = require('../src/models/EmailVerificationToken');

async function signupAndLoginUser(app, userData = {}) {
    const defaultData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        timezone: "Asia/Kolkata"
    };

    const finalData = { ...defaultData, ...userData };

    // 1. Signup
    const signupRes = await request(app)
        .post('/api/user/signup')
        .send(finalData);

    if (signupRes.statusCode !== 201) {
        throw new Error(`Signup failed with status ${signupRes.statusCode}: ${JSON.stringify(signupRes.body)}`);
    }

    // 2. Fetch User and Token
    const user = await User.findOne({ email: finalData.email });
    if (!user) throw new Error("User not found after signup");

    const tokenDoc = await EmailVerificationToken.findOne({ userId: user._id });
    if (!tokenDoc) throw new Error("Verification token not found after signup");

    // 3. Verify Email
    const verifyRes = await request(app)
        .post('/api/user/verify-email')
        .send({ token: tokenDoc.token });

    if (verifyRes.statusCode !== 200) {
        throw new Error(`Verify email failed with status ${verifyRes.statusCode}: ${JSON.stringify(verifyRes.body)}`);
    }

    // 4. Login
    const loginRes = await request(app)
        .post('/api/user/login')
        .send({
            email: finalData.email,
            password: finalData.password
        });

    if (loginRes.statusCode !== 200) {
        throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }

    return {
        userId: user._id.toString(),
        token: loginRes.body.token,
        user: user.toObject({ getters: true })
    };
}

module.exports = {
    signupAndLoginUser
};
