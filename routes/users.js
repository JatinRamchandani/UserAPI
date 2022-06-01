const e = require('express');
const express = require('express');
const path = require("path");
const router = express.Router();
const user = require('../models/users');
const jwt= require('jsonwebtoken');
const { verify } = require('crypto');


const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;


router.get("/",(req,res)=>{
    res.send("Running");
})

router.post('/signup', async (req, res) => {

    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email = req.body.email;
    let password = req.body.password;

    try {
        if(!email.match(mailformat)){
            res.status(400).send("Invalid Email format");
        }
        const finduser = await user.findOne({ email: email });
        if (finduser!=null) {
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
            console.log(newuser);
            res.status(201).send({ "result": "user added" });
        }
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
})



router.post('/login', async (req, res) => {

    let email = req.body.email;
    let password = req.body.password;

    console.log({ "email": email, "pass": password });

    try {
        if(!email.match(mailformat)){
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

    console.log({ "email": email});

    try {
        if(!email.match(mailformat)){
            res.status(400).send("Invalid Email format");
        }
        const thisuser = await user.findOne({ email: email});
        if(thisuser==null){
            res.send("User doesn't exist");
        }
        
        const secret = process.env.JWT_SECRET + thisuser.password;
        const payload = {
            email: thisuser.email,
            id: thisuser._id
        }

        const token = jwt.sign(payload, secret, {expiresIn: '15m'});
        const link = `https://gousergo.herokuapp.com/api/users/reset-password/${thisuser._id}/${token}`;
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
        const thisuser = await user.findOne({ _id: id});
        if(thisuser==null){
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
        const thisuser = await user.findOne({ _id: id});
        if(thisuser==null){
            res.send("Invalid Id");
        }
        const secret = process.env.JWT_SECRET + password;
        const payload = jwt.verify(token, secret);

        const changeuser = await user.updateOne({_id: id},{$set:{password: password2}})
        res.status(200).send("password changed");

    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }

})



module.exports = router