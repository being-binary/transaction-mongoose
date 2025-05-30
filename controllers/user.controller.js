import mongoose from "mongoose"
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import bcrypt from "bcryptjs";
import dotenv from 'dotenv'
import { genSaltSync } from "bcryptjs"
import { validationResult } from "express-validator"
import usercollection from '../models/user.model.js'

dotenv.config()
const salt = genSaltSync(10)

const registerUser = async (req, res) => {

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() })
    }

    const { firstName, lastName, email, password } = req.body
    try {
        const isexist = await usercollection.findOne({ email })
        if (isexist) {
            return res.status(401).json({ msg: 'user already exists', success: true })
        }
        const ack = await usercollection.insertOne({
            name: {
                firstName,
                lastName
            },
            email,
            password,
        })
        res.status(201).json({ msg: 'user created successfully', success: true })
    } catch (err) {
        res.status(401).json({ msg: 'error occured', success: false, error: err.message })
    }
}

const loginUser = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const { email, password } = req.body;

    try {
        const isExist = await usercollection.findOne({ email }).select('+password');
        if (!isExist) {
            return res.status(401).json({ msg: 'User does not exist', success: false });
        }

        const isPasswordValid = isExist.correctPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ msg: 'Wrong password', success: false });
        }

        // Create a token
        const token = jwt.sign({ _id: isExist._id }, process.env.EXPRESS_JWT_KEY, { expiresIn: '24h' });

        // Save to session
        req.session.token = token;
        req.session.userId = isExist._id;
        req.session.isAuthenticated = true;

        return res.status(200).redirect( '/api/home');
    } catch (err) {
        return res.status(500).json({ msg: 'Server error', success: false, error: err.message });
    }
};


const deleteUser = async (req, res) => {
    const id = req.id
    const isExist = await usercollection.findById(new mongoose.Types.ObjectId(id))
    if (!isExist) {
        return res.status(404).json({ msg: 'user not found', success: false })
    }
    try {
        const ack = await usercollection.deleteOne({ _id: id })
        if (ack.deletedCount) {
            res.status(200).json({ msg: 'user deleted successfully', success: true })
        }
        else {
            res.status(404).json({ msg: 'error in deleting', success: false })
        }
    } catch (error) {
        res.status(401).json({ msg: 'error occured', success: false, error: err.message })
    }
}

const updateUser = async (req, res) => {
    const id = req.id
    const { firstName, lastName, bio, password, profilePic } = req.body
    const obj = {}
    if (firstName) {
        obj.name.firstName = firstName
    }
    if (lastName) {
        obj.name.lastName = lastName
    } if (bio) {
        obj.bio = bio
    } if (profilePic) {
        obj.profilePic = profilePic
    }
    if (password) {
        hashedpassword = hashSync(password, salt)
        obj.password = hashedpassword
    }
    const isExist = await usercollection.findById(id)
    if (!isExist) {
        return res.status(404).json({ msg: 'user not found', success: false })
    }
    try {
        const ack = await usercollection.updateOne({ _id: id }, { $set: { ...obj } })
        console.log(ack)
        if (ack.modifiedCount) {
            res.status(200).json({ msg: 'user updated successfully', success: true })
        }
        else {
            res.status(404).json({ msg: 'no field modified', success: false })
        }
    } catch (err) {
        res.status(401).json({ msg: 'error occured', success: false, error: err.message })
    }
}

const forgetpassword = async (req, res) => {

    const { email } = req.body

    const user = await usercollection.findOne({ email })

    if (user) {
        const passwordToken = jwt.sign({ email }, 'token for update password', { expiresIn: '2m' })
        user.resetpasswordtoken = passwordToken
        const ack = await user.save()
        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for port 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // async..await is not allowed in global scope, must use a wrapper

            // send mail with defined transport object
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER, // sender address
                to: email, // list of receivers
                subject: "PASSWORD RESET LINK", // Subject line
                text: `CLICK ON THE LINK TO RESET THE PASSWORD \n http://localhost:8082/user/reset-password/${passwordToken}`, // plain text body
                // html: "<b>Hello world?</b>", // html body
            });

            // console.log("Message sent: %s", info.messageId);
            return res.status(200).json({ msg: 'mail send sucessfully ', success: true })
        } catch (error) {
            return res.status(401).json({ msg: 'something went wrong', success: false, err: error.message })
        }
    }
    else {
        return res.status(404).json({ msg: 'email not found', success: false })
    }


}

const forgetpasswordPage = async (req, res) => {
    const { token } = req.params
    try {
        const user = await usercollection.findOne({ resetpasswordtoken: token })
        if (user) {
            res.render('password-reset-form', { token, email: user.email })
        }
    } catch (error) {
        res.status(404).json({ msg: 'token expired', success: false })
    }
}

const setNewPassword = async (req, res) => {
    const { password } = req.body
    const token = req.headers.authorization
    try {
        const checkuser = await usercollection.findOne({ resetpasswordtoken: token })
        if (checkuser) {
            checkuser.password = password
            checkuser.resetpasswordtoken = ""
            const save = await checkuser.save()

            res.status(200).json({ msg: 'password update', success: true })

        } else {
            res.status(202).json({ msg: 'wrong token', success: false })
        }
    } catch (err) {
        res.status(404).json({ msg: 'user not found', success: false, err: err.message })
    }
}

const getdetails = async (req, res) => {
    const id = req.id
    try {
        const userdetails = await usercollection.find({ _id: id }, { password: 0 })
        res.status(200).json({ msg: 'user found successfully', success: true, userdetails })
    } catch (err) {
        res.status(500).json({ msg: 'something went wrong', success: false })
    }
}

const followAndFollowing = async (req, res) => {
    try {
        const { id } = req
        const { oid } = req.body

        const user = await usercollection.findOne({ _id: oid })
        if (user) {
            if (user.followers.includes(id)) {
                user.followers.pull(id)
                await user.save()
                const self = await usercollection.findOne({ _id: id })
                self.followings.pull(oid)
                await self.save()
                return res.status(200).json({ msg: "unfollow completed", success: true })
            } else {
                user.followers.push(id)
                await user.save()
                const self = await usercollection.findOne({ _id: id })
                self.followings.push(oid)
                await self.save()
                return res.status(200).json({ msg: "following completed", success: true })
            }
        } else {
            return res.status(404).json({ msg: "user not found", success: false })
        }

    } catch (err) {
        return res.status(500).json({ msg: `${err.message}`, success: false })
    }

}

const logout_user = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/api/user/login');
    });
}








export {
    registerUser,
    updateUser,
    deleteUser,
    loginUser,
    forgetpassword,
    forgetpasswordPage,
    setNewPassword,
    getdetails,
    followAndFollowing,
    logout_user
}