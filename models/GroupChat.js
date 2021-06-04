const mongoose = require("mongoose")



const GroupChatSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required : false
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        system : {
            type : Boolean,
            default : false,
            required : false
        }
    }
)

module.exports = mongoose.model("GroupChat", GroupChatSchema)