const mongoose = require("mongoose")



const PrivateChatSchema = mongoose.Schema(
    {
        sender: mongoose.Schema.Types.ObjectId,
        reciever: mongoose.Schema.Types.ObjectId,
        text: String,
        time: {
            type: Date,
            default: Date.now
        }
    }
)

module.exports = mongoose.model("PrivateChat", PrivateChatSchema)