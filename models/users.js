const mongoose=require('mongoose');

var SchemaTypes = mongoose.Schema.Types;
const userSchema=new mongoose.Schema({

    first_name:{
        type: String,
        required: true
    },

    last_name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        require: true
        
    },
    password:{
        type: String,
        reqruired: true
    },

    verified:{
        type: Boolean,
    },
})

module.exports=mongoose.model('users',userSchema)