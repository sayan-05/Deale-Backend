const mongoose = require("mongoose")



const UserSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        friends: [{
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }],
        joined: {
            type: Date,
            default: Date.now
        },
        active: {
            type: Boolean,
            default: false
        }
    }
)

module.exports = mongoose.model('User', UserSchema)