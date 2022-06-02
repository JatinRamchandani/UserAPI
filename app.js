const express=require('express');
const bodyParser=require('body-parser');
const { urlencoded } = require('body-parser');
const app=express();
const { query } = require('express');
const mongoose= require('mongoose');
const dotenv=require('dotenv').config();
const port=process.env.PORT || 8000;
const passport = require("passport");
const usersRouter=require('./routes/users');
const cookieSession = require('cookie-session')
require('./passport-setup')


mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true,useUnifiedTopology: true})

const db=mongoose.connection
db.on('error',(error)=> console.log(error));
db.once('open',()=>console.log("Connected to database"));

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}))

app.use(cookieSession({
    name: 'user-session',
    keys: ['key1', 'key2']
}))

app.use(passport.initialize())
app.use(passport.session())


app.use('/api/users',usersRouter)


app.listen(port,()=>{
    console.log(`Website running on port ${port}`)});