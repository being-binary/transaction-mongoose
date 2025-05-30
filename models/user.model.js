import { genSaltSync, hashSync, compareSync } from "bcryptjs";
import mongoose from "mongoose";
import validator from "validator";
import crypto from "node:crypto";

const userSchema = new mongoose.Schema({
    name: {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            minLength: [3, 'First name must be at least 3 characters'],
            maxLength: [50, 'First name cannot exceed 50 characters'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            minLength: [3, 'Last name must be at least 3 characters'],
            maxLength: [50, 'Last name cannot exceed 50 characters'],
            trim: true
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters'],
        select: false // Never return password in queries
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.name.firstName} ${this.name.lastName}`;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = genSaltSync(12);
        this.password = hashSync(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Update passwordChangedAt when password is modified
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after
    next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword ) {
    return compareSync(candidatePassword , this.password);
};

// Instance method to check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Query middleware to filter out inactive users by default
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model('User', userSchema);

export default User;