const mongoose = require("mongoose")
const Schema = mongoose.Schema



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
        friends : [Schema.Types.ObjectId],
        joined: {
            type: Date,
            default: Date.now
        }
    }
)

module.exports = mongoose.model('User', UserSchema)