const mongoose = require("mongoose")
const crypto = require("crypto");
const ObjectId = require("mongodb").ObjectID


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
        friends: [mongoose.Schema.Types.ObjectId],
        joined: {
            type: Date,
            default: Date.now
        },
        publicId: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => {
                return ObjectId(crypto.randomBytes(12).toString("hex"))
            },
            unique: true
        },
        active: {
            type: Boolean,
            default: false
        }
    }
)

module.exports = mongoose.model('User', UserSchema)