const mongoose = require('mongoose');

var SchemaTypes = mongoose.Schema.Types;
const userOTPverificationSchema = new mongoose.Schema({

    userId: {
        type: String,
        required: true
    },
    otp: {
        type: String,
    },
    createdAt: {
        type: String,
    },
    expiresAt: {
        type: String,
    },
})

module.exports=mongoose.model('userOTPverification',userOTPverificationSchema);