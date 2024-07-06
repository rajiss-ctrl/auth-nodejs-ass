const { userModel } = require("../model/userModel");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/emailUtil");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");


// User registration endpoint

const registerUser = async (req, res) => {
    console.log('Request body:', req.body); 
    const { fullName, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const token = uuidv4();

    try {
        await userModel.create({
            fullName,
            email,
            password: hashedPassword,
            authToken: token,
            authPurpose: 'verify-email'
        });

        await sendEmail(
            email,
            'Verify email',
            `Hello ${fullName}, the link to verify your email is http://localhost:3000/auth/verify-email/${token}`
        );

        res.status(201).send({
            isSuccessful: true,
            message: 'Kindly check your email to verify it'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({
            isSuccessful: false,
            message: 'Error registering user',
            error: error.message
        });
    }
}

//Verify user's Email

const userEmailVerification = async (req, res )=>{
    const { token } = req.params;

    try {
        const doesUserExist = await userModel.exists({ authToken: token, authPurpose: "verify-email" });
        if (!doesUserExist) {
            res.status(404).send({
                isSuccessful: false,
                message: "The user does not exist"
            });
            return;
        }

        await userModel.findOneAndUpdate({ authToken: token, authPurpose: "verify-email" }, {
            isEmailVerified: true // Corrected property name
        });

        res.send({
            isSuccessful: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        res.status(500).send({
            isSuccessful: false,
            message: "Error verifying email",
            error: error.message
        });
    }
}

// user login

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(404).send({
                isSuccessful: false,
                message: "User does not exist"
            });
            return;
        }

        const doPasswordsMatch = bcrypt.compareSync(password, user.password);
        if (!doPasswordsMatch) {
            res.status(400).send({
                isSuccessful: false,
                message: "Password is not correct"
            });
            return;
        }

        const userToken = jwt.sign(
            {
                userId: user._id,
                email: user.email 
            },
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );

        res.send({
            isSuccessful: true,
            userDetails: {
                fullName: user.fullName,
                email: user.email
            },
            userToken,
            message: "Login successful"
        });
    } catch (error) {
        res.status(500).send({
            isSuccessful: false,
            message: "Error logging in user",
            error: error.message
        });
    }
}

// Forgot password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const resetToken = uuidv4();

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(404).send({
                isSuccessful: false,
                message: 'User does not exist'
            });
            return;
        }

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await sendEmail(
            email,
            'Reset Password',
            `Hello, the link to reset your password is http://localhost:3000/auth/reset-password/${resetToken}`
        );

        res.send({
            isSuccessful: true,
            message: 'Check your email for the password reset link'
        });
    } catch (error) {
        res.status(500).send({
            isSuccessful: false,
            message: 'Error sending reset password email',
            error: error.message
        });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await userModel.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            res.status(400).send({
                isSuccessful: false,
                message: 'Invalid or expired reset token'
            });
            return;
        }

        user.password = bcrypt.hashSync(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.send({
            isSuccessful: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        res.status(500).send({
            isSuccessful: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// View profile (Protected route)

const viewUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await userModel.findById(userId, '-password'); // Exclude the password field

        if (!user) {
            return res.status(404).send({
                isSuccessful: false,
                message: 'User not found'
            });
        }

        res.send({
            isSuccessful: true,
            user
        });
    } catch (error) {
        res.status(500).send({
            isSuccessful: false,
            message: 'Error retrieving user profile',
            error: error.message
        });
    }
};





module.exports = {
    registerUser,
    userEmailVerification,
    userLogin,
    forgotPassword,
    resetPassword,
    viewUserProfile,
}