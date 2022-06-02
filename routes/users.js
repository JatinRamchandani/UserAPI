const e = require('express');
const express = require('express');
const path = require("path");
const router = express.Router();
const user = require('../models/users');
const jwt = require('jsonwebtoken');
const { verify } = require('crypto');
const bcrypt = require('bcrypt');
const userOTPverification = require('../models/userOTPverification');
const { route } = require('express/lib/application');


const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;


router.get("/", (req, res) => {
    res.send("Running");
})

router.post('/signup', async (req, res) => {

    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email = req.body.email;
    let password = req.body.password;

    try {
        if (!email.match(mailformat)) {
            res.status(400).send("Invalid Email format");
        }
        const finduser = await user.findOne({ email: email });
        if (finduser != null) {
            console.log(finduser);
            res.status(400).send("User already Exists")
        }
        else {
            const nuser = new user({
                first_name: first_name,
                last_name: last_name,
                email: email,
                password: password,
            });
            const newuser = await nuser.save()
            const verification = await sendOTPVerificationEmail(newuser, res);
            console.log(newuser);
            // res.send({ "result": "user added" });
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
})

const sendOTPVerificationEmail = async ({ _id, email }, res) => {
    try {
        const otp = `${Math.floor(10000 + Math.random() * 9000)}`;
        const saltRounds = 10;

        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification = await new userOTPverification({
            userId: _id,
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000,
        })

        await newOTPVerification.save();
        console.log(otp);


        // I know how to email the otp but for security reasons now,
        // I am sending otp in reponse 
        res.json({
            status: "PENDING",
            otp: otp,
            message: "Verification otp sent",
            data: {
                userId: _id,
            }
        })
    }
    catch (error) {
        res.json({
            status: "FAILED",
            message: error.message
        })
    }
}


router.post('/verifyOTP', async (req, res) => {
    try{
        let {userId, otp} = req.body;

        if(!userId || !otp){
            throw Error("Empty otp details are not allowed");
        }
        else{
            const UserOTPVerificationRecords = await userOTPverification.find({
                userId,
            });
            if(UserOTPVerificationRecords.length<=0){
                throw new Error(
                    "Account record doesn't exist or has been verified already. Please sign up or log in."
                );
            }
            else{
                const {expiresAt} = UserOTPVerificationRecords[0];
                const hashedOTP = UserOTPVerificationRecords[0].otp;

                if(expiresAt < Date.now()){
                    await userOTPverification.deleteMany({userId});
                    throw new Error("Code has expired. Please Request Again.");
                }

                else{
                    const validOTP = await bcrypt.compare(otp, hashedOTP);

                    if(!validOTP){
                        throw new Error("Invalid code passed. Check your Inbox.");
                    }

                    else{
                        await user.updateOne({_id: userId}, {$set :{ verified: true}});
                        await userOTPverification.deleteMany({userId});

                        res.json({
                            status: "VERIFIED",
                            message : "User email verified successfully"
                        })
                    }
                }

            }
        }
    }
    catch (error) {
        res.json({
            status : "FAILED",
            message : error.message
        })
    }
})


router.post('/resendOTP', async(req, res)=>{
    try{
        let {userId, email} = req.body;

        if(!email || !userId){
            throw Error ("Empty user details are not allowed");
        }
        else{
            await userOTPverification.deleteMany({userId});
            sendOTPVerificationEmail({_id: userId, email}, res);
        }
    }
    catch(error){
        res.json({
            status :"FAILED",
            message: error.message
        })
    }
} )



router.post('/login', async (req, res) => {

    let email = req.body.email;
    let password = req.body.password;

    console.log({ "email": email, "pass": password });

    try {
        if (!email.match(mailformat)) {
            res.status(400).send("Invalid Email format");
        }
        const thisuser = await user.findOne({ email: email });
        if (thisuser.password === password) {
            console.log(thisuser);
            res.send(thisuser);
        } else {
            res.status(400).send("password is not matching");
        }
    }
    catch (err) {
        res.status(400).json("Invalid Email");
    }


})


router.post('/forget-password', async (req, res) => {

    let email = req.body.email;

    console.log({ "email": email });

    try {
        if (!email.match(mailformat)) {
            res.status(400).send("Invalid Email format");
        }
        const thisuser = await user.findOne({ email: email });
        if (thisuser == null) {
            res.send("User doesn't exist");
        }

        const secret = process.env.JWT_SECRET + thisuser.password;
        const payload = {
            email: thisuser.email,
            id: thisuser._id
        }

        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        const link = `https://localhost:8000/api/users/reset-password/${thisuser._id}/${token}`;
        console.log(link);
        res.status(200).send(link);


    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }


})


router.get('/reset-password/:id/:token/', async (req, res) => {

    let id = req.params.id;
    let token = req.params.token;

    try {
        const thisuser = await user.findOne({ _id: id });
        if (thisuser == null) {
            res.send("Invalid Id");
        }
        const secret = process.env.JWT_SECRET + thisuser.password;
        const payload = jwt.verify(token, secret);
        res.status(200).send(payload);
        // at response we will go to the reset password page
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

})


router.post('/reset-password/:id/:token/', async (req, res) => {

    let id = req.params.id;
    let token = req.params.token;

    let password = req.body.pass_before;
    let password2 = req.body.pass_after;

    try {
        const thisuser = await user.findOne({ _id: id });
        if (thisuser == null) {
            res.send("Invalid Id");
        }
        const secret = process.env.JWT_SECRET + password;
        const payload = jwt.verify(token, secret);

        const changeuser = await user.updateOne({ _id: id }, { $set: { password: password2 } })
        res.status(200).send("password changed");

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

})



module.exports = router