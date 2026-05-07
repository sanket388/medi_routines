// user model
const { validationResult } = require("express-validator");
const User = require("../models/User.js");
const EmailVerificationToken = require("../models/EmailVerificationToken.js");
const HttpError = require("../models/HttpError.js");
const { hash, compare } = require("bcrypt");
const config = require("../configs/config.js");
const { sign } = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { sendEmail } = require("../services/email-service.js");
const { verificationEmailTemplate } = require("../utils/email-templates.js");

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

        // create the user and token documents
        const createdUser = new User(
            {
                name,
                email,
                password: hashedPassword,
                timezone,
                routines: [],
                userDefinedMedicines: [],
                isEmailVerified: false
            }
        );
        const tokenDoc = new EmailVerificationToken(
            {
                userId: createdUser._id,
                token: verificationToken,
                expiresAt
            }
        );
        const session = await mongoose.startSession();
        try
        {
            // create user and token atomically inside a session
            await session.withTransaction(async () =>
            {
                await createdUser.save({ session });
                await tokenDoc.save({ session });
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

        // match the password
        const match = await compare(password, user.password);

        if(match)
        {
            let token = sign(
                {
                    userId: user._id,
                    email: user.email,
                    name: user.name
                },
                config.jwtSecret,
                {
                    expiresIn: "24h"
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

module.exports = {
    signup,
    login,
    getUser,
    registerFcmToken
};