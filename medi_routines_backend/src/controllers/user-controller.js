// user model
const { validationResult } = require("express-validator");
const User = require("../models/User.js");
const EmailVerificationToken = require("../models/EmailVerificationToken.js");
const ForgotPasswordToken = require("../models/ForgotPasswordToken.js");
const HttpError = require("../models/HttpError.js");
const { hash, compare } = require("bcrypt");
const config = require("../configs/config.js");
const { sign } = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { sendEmail } = require("../services/email-service.js");
const { verificationEmailTemplate, forgotPasswordEmailTemplate } = require("../utils/email-templates.js");

// for sign in with google
const {OAuth2Client} = require('google-auth-library');
const googleClient = new OAuth2Client(config.googleClientId);

const SALT_ROUNDS = 12;

// method to sign up a user
const signup = async (req, res, next) =>
{

    try
    {
        // validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid inputs passed, please check your data.", 422);
        }
    
        // get the data from request body
        const {name, email, password, timezone} = req.body;
    
        // check if user already exists
        let existingUser;
        try
        {
            existingUser = await User.find({email: email});
            
        }
        catch(err)
        {
            console.log("UserController :: Signup :: ", err);
            throw new HttpError("Cannot fetch necessary data. Please try again later.", 500);
        }
    
        if(existingUser.length > 0)
        {
            throw new HttpError("Email already taken.", 409);
        }

        // hash the password
        const hashedPassword = await hash(password, SALT_ROUNDS);

        // generate a secure random token for email verification
        const verificationToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

        const session = await mongoose.startSession();
        try
        {
            // create user and token atomically inside a session
            await session.withTransaction(async () =>
            {
                const [createdUser] = await User.create([{
                    name,
                    email,
                    password: hashedPassword,
                    timezone,
                    routines: [],
                    userDefinedMedicines: [],
                    isEmailVerified: false,
                    // since this is signup with email and password, local is the auth provider.
                    authProviders: ['local']
                }], { session });

                await EmailVerificationToken.create([{
                    userId: createdUser._id,
                    token: verificationToken,
                    expiresAt
                }], { session });
            });
        }
        catch(err)
        {
            console.log("UserController :: Signup :: ", err);
            throw new HttpError("Failed to signup. Please try again.", 500);
        }
        finally
        {
            await session.endSession();
        }

        // send verification email
        try
        {
            const to = email;
            const subject = "Verify your email for MediRoutines";
            const html = verificationEmailTemplate(`${config.frontendUrl}/auth/verify-email?token=${verificationToken}`);
            await sendEmail(to, subject, html);
        }
        catch(err)
        {
            console.error("UserController :: Signup :: Failed to send verification email :: ", err);
        }

        // send response
        res
        .status(201)
        .json({ message: "Verification link sent. Please check your email to verify your account." });

    }
    catch(e)
    {
        console.log(e);
        return next(e);
    }

};

// method to generate and send jwt
const login = async(req, res, next)=>
{
    try
    {

        const errors = validationResult(req);

        if(!errors.isEmpty())
        {
            // invalid
            throw new HttpError("Invalid inputs, please try again.", 422);
        }

        // get the credentials
        const {email, password} = req.body;

        // get the user from db
        let user;
        try
        {
            user = await User.findOne({email});
        }
        catch(err)
        {
            console.log("UserController :: login :: ", err);
            throw new HttpError("Failed to login. Please try again later", 500);
        }

        if(!user)
        {
            // user not found
            throw new HttpError("Incorrect credentials", 401);
        }

        // user has no password (google-only account)
        if (!user.password) {
            throw new HttpError("Incorrect credentials", 401);
        }

        // match the password
        const match = await compare(password, user.password);

        if(match)
        {
            // check email verification
            if (!user.isEmailVerified)
            {
                throw new HttpError("Please verify your email before logging in.", 403);
            }

            let token = sign(
                {
                    userId: user._id,
                    email: user.email,
                    name: user.name
                },
                config.jwtSecret,
                {
                    expiresIn: "7d"
                }
            );

            // send the token as response
            res
            .status(200)
            .json(
                {
                    token
                }
            );
        }
        else
        {
            // incorrect pass
            throw new HttpError("Incorrect credentials", 401);
        }


    }
    catch(e)
    {
        console.log(e);
        return next(e);
    }
};

// method to get user details
const getUser = async(req, res, next)=>
{
    try
    {
        // get the user id from the request
        const userId = req.user.userId;

        // get the user from db
        let user;
        try
        {
            user = await User.findById(userId);
        }
        catch(err)
        {
            console.log("UserController :: getUser :: ", err);
            throw new HttpError("Failed to fetch user. Please try again later", 500);
        }

        if(!user)
        {
            // user not found
            throw new HttpError("User not found", 404);
        }

        // remove the password from to-send
        user.password = undefined;

        // send response
        res.status(200).json({user: user.toObject({getters: true})});
    }
    catch(e)
    {
        console.log(e);
        return next(e);
    }
};

// method to register a new fcm token
const registerFcmToken = async (req, res, next) =>
{
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        throw new HttpError("Invalid FCM token provided.", 422);
    }

    const { fcmToken } = req.body;
    const userId = req.user.userId;

    try
    {
        const user = await User.findById(userId);
        if (!user)
        {
            return next(new HttpError("User not found.", 401));
        }

        // Add token if it's new for this user to prevent duplicates
        if (!user.fcmTokens.includes(fcmToken))
        {
            user.fcmTokens.push(fcmToken);
            try
            {
                await user.save();
            }
            catch(err)
            {
                console.error("UserController :: registerFcmToken :: ", err);
                throw new HttpError("Failed to add fcm token", 500);
            }
        }

        res.status(200).end();
    }
    catch (err)
    {
        console.log(err);
        return next(err);
    }
};

// method to verify email using the token from the email link
const verifyEmail = async (req, res, next) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid request. Token is required.", 422);
        }

        // get the token from request body
        const { token } = req.body;

        // find the token document
        let tokenDoc;
        try
        {
            tokenDoc = await EmailVerificationToken.findOne({ token });
        }
        catch (err)
        {
            console.log("UserController :: verifyEmail :: ", err);
            throw new HttpError("Failed to verify email. Please try again later.", 500);
        }

        if (!tokenDoc)
        {
            // token not found
            throw new HttpError("Invalid or already used verification link.", 400);
        }

        // check expiry
        if (tokenDoc.expiresAt < new Date())
        {
            // try to delete expired token
            try
            {
                await EmailVerificationToken.deleteOne({ _id: tokenDoc._id });
            }
            catch (err)
            {
                console.error("UserController :: verifyEmail :: Failed to delete expired token :: ", err);
            }
            throw new HttpError("Verification link has expired. Please request a new one.", 410);
        }

        // atomically mark user verified and delete token
        const session = await mongoose.startSession();
        try
        {
            await session.withTransaction(async () =>
            {
                await User.updateOne(
                    { _id: tokenDoc.userId },
                    { $set: { isEmailVerified: true } },
                    { session }
                );

                await EmailVerificationToken.deleteOne({ _id: tokenDoc._id }, { session });
            });
        }
        catch (err)
        {
            console.log("UserController :: verifyEmail :: ", err);
            throw new HttpError("Failed to verify email. Please try again later.", 500);
        }
        finally
        {
            await session.endSession();
        }

        res.status(200).json({ message: "Email verified successfully." });
    }
    catch (e)
    {
        console.log(e);
        return next(e);
    }
};

// method to request a new verification link
const requestVerificationLink = async (req, res, next) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid inputs, please provide valid email.", 422);
        }

        const { email } = req.body;

        // find the user
        let user;
        try
        {
            user = await User.findOne({ email });
        }
        catch (err)
        {
            console.log("UserController :: requestVerificationLink :: ", err);
            throw new HttpError("Failed to request link. Please try again later.", 500);
        }

        // To prevent email enumeration, we always return 200 with the same message
        // whether the user exists, is already verified, or actually gets a link.
        const successMessage = "Verification link sent";

        if (!user || user.isEmailVerified)
        {
            return res.status(200).json({ message: successMessage });
        }

        // generate a secure random token for email verification
        const verificationToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

        // create the new token
        const tokenDoc = new EmailVerificationToken(
            {
                userId: user._id,
                token: verificationToken,
                expiresAt
            }
        );

        // replace any existing token with a new one
        const session = await mongoose.startSession();
        try
        {
            await session.withTransaction(async () =>
            {
                // delete any existing tokens for this user
                await EmailVerificationToken.deleteMany({ userId: user._id }, { session });
                await tokenDoc.save({ session });
            });
        }
        catch (err)
        {
            console.log("UserController :: requestVerificationLink :: ", err);
            throw new HttpError("Failed to request link. Please try again later.", 500);
        }
        finally
        {
            await session.endSession();
        }

        // send verification email
        try
        {
            const to = email;
            const subject = "Verify your email for MediRoutines";
            const html = verificationEmailTemplate(`${config.frontendUrl}/auth/verify-email?token=${verificationToken}`);
            await sendEmail(to, subject, html);
        }
        catch (err)
        {
            console.error("UserController :: requestVerificationLink :: Failed to send email :: ", err);
            throw new HttpError("Failed to send verification link. Please try again later.", 500);
        }

        res.status(200).json({ message: successMessage });
    }
    catch (e)
    {
        console.log(e);
        return next(e);
    }
};

// method to request a forgot password link
const forgotPassword = async (req, res, next) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid inputs, please provide valid email.", 422);
        }

        const { email } = req.body;

        // To prevent email enumeration, always return the same success response.
        // This avoids revealing whether the account exists or is eligible for reset.
        const successMessage = "Password reset link sent on registered mail";

        let user;
        try
        {
            user = await User.findOne({ email });
        }
        catch (err)
        {
            console.log("UserController :: forgotPassword :: ", err);
            throw new HttpError("Failed to request password reset. Please try again later.", 500);
        }

        if (!user || !user.isEmailVerified)
        {
            return res.status(200).json({ message: successMessage });
        }

        // Generate a fresh token and replace any existing one so only one reset link stays valid.
        const resetToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const session = await mongoose.startSession();
        try
        {
            await session.withTransaction(async () =>
            {
                await ForgotPasswordToken.deleteMany({ userId: user._id }, { session });
                await ForgotPasswordToken.create([{
                    userId: user._id,
                    token: resetToken,
                    expiresAt
                }], { session });
            });
        }
        catch (err)
        {
            console.log("UserController :: forgotPassword :: ", err);
            throw new HttpError("Failed to request password reset. Please try again later.", 500);
        }
        finally
        {
            await session.endSession();
        }

        try
        {
            const to = email;
            const subject = "Reset your MediRoutines password";
            const html = forgotPasswordEmailTemplate(`${config.frontendUrl}/auth/change-password?token=${resetToken}`);
            await sendEmail(to, subject, html);
        }
        catch (err)
        {
            console.error("UserController :: forgotPassword :: Failed to send email :: ", err);
            throw new HttpError("Failed to send password reset link. Please try again later.", 500);
        }

        res.status(200).json({ message: successMessage });
    }
    catch (e)
    {
        console.log(e);
        return next(e);
    }
};

// method to change password using forgot password token
const changePassword = async (req, res, next) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid inputs passed, please check your data.", 422);
        }

        const { token, newPassword } = req.body;

        let tokenDoc;
        try
        {
            tokenDoc = await ForgotPasswordToken.findOne({ token });
        }
        catch (err)
        {
            console.log("UserController :: changePassword :: ", err);
            throw new HttpError("Failed to change password. Please try again later.", 500);
        }

        if (!tokenDoc)
        {
            throw new HttpError("Invalid password reset link.", 400);
        }

        // Delete expired tokens eagerly so they cannot be retried again.
        if (tokenDoc.expiresAt < new Date())
        {
            try
            {
                await ForgotPasswordToken.deleteOne({ _id: tokenDoc._id });
            }
            catch (err)
            {
                console.error("UserController :: changePassword :: Failed to delete expired token :: ", err);
            }

            throw new HttpError("Password reset link has expired. Please request a new one.", 410);
        }

        const hashedPassword = await hash(newPassword, SALT_ROUNDS);

        // Update the password and consume the token in one transaction.
        // This prevents partial success where one step succeeds without the other.
        const session = await mongoose.startSession();
        try
        {
            await session.withTransaction(async () =>
            {
                await User.updateOne(
                    { _id: tokenDoc.userId },
                    {
                        $set: { password: hashedPassword },
                        $addToSet: { authProviders: 'local' } // in case user was google-only, now they can login with password too
                    },
                    { session }
                );

                await ForgotPasswordToken.deleteOne({ _id: tokenDoc._id }, { session });
            });
        }
        catch (err)
        {
            console.log("UserController :: changePassword :: ", err);
            throw new HttpError("Failed to change password. Please try again later.", 500);
        }
        finally
        {
            await session.endSession();
        }

        res.status(200).json({ message: "Password changed successfully." });
    }
    catch (e)
    {
        console.log(e);
        return next(e);
    }
};

const googleSignin = async (req, res, next) =>
{
    try
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            throw new HttpError("Invalid inputs passed, please check your data.", 422);
        }

        const { idToken, timezone } = req.body;

        // verify id token with google
        let payload;
        try
        {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: config.googleClientId
            });
            payload = ticket.getPayload();
        }
        catch (err)
        {
            console.log("UserController :: googleSignin :: ", err);
            throw new HttpError("Invalid Google token.", 401);
        }

        const { sub: googleId, email, name } = payload;

        // find or create user
        let user;
        const session = await mongoose.startSession();
        try
        {
            await session.withTransaction(async () => {

                // 1. find by googleId
                user = await User.findOne({ googleId }).session(session);

                if (user) {
                    // already a google user, just login
                    return;
                }

                // 2. find by email, add google as auth provider if found
                user = await User.findOne({ email }).session(session);

                if (user)
                {
                    // existing local user — add google as auth provider
                    user.googleId = googleId;
                    if (!user.authProviders.includes('google')) {
                        user.authProviders.push('google');
                    }
                    user.isEmailVerified = true;
                    await user.save({ session });
                    return;
                }

                // 3. new user — create
                [user] = await User.create([{
                    name,
                    email,
                    timezone,
                    googleId,
                    authProviders: ['google'],
                    isEmailVerified: true,
                    routines: [],
                    userDefinedMedicines: []
                }], { session });
            });
        }
        catch (err)
        {
            console.log("UserController :: googleSignin :: ", err);
            throw new HttpError("Google sign in failed. Please try again.", 500);
        }
        finally
        {
            await session.endSession();
        }

        // issue jwt for found or created user
        const token = sign(
            { userId: user._id, name: user.name, email: user.email },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({ token });

    } catch (e) {
        console.log(e);
        return next(e);
    }
};


module.exports = {
    signup,
    login,
    getUser,
    registerFcmToken,
    verifyEmail,
    requestVerificationLink,
    forgotPassword,
    changePassword,
    googleSignin
};