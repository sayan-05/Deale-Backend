const mongoose = require("mongoose")



const PrivateChatSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
)

module.exports = mongoose.model("PrivateChat", PrivateChatSchema)