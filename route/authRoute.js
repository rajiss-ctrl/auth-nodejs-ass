const express = require("express");
const jwt = require("jsonwebtoken"); 
const { registerUser, userEmailVerification, userLogin, forgotPassword, resetPassword, viewUserProfile } = require("../controller/authController");
const authRouter = express.Router(); 

// Middleware to authenticate the user
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token:', token); 

    if (!token) return res.sendStatus(403); 

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        req.user = user;
        next();
    });
};




// User registration endpoint
authRouter.post('/register', registerUser);

// Email verification endpoint
authRouter.get('/verify-email/:token', userEmailVerification);

// User login endpoint
authRouter.post('/login', userLogin)

// Forgot password
authRouter.post('/forgot-password', forgotPassword);

// Reset password
authRouter.post('/reset-password/:token', resetPassword);

// View profile (Protected route)
authRouter.get('/profile/:userId',authenticateToken, viewUserProfile);

module.exports = authRouter;
