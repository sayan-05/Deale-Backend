const mongoose = require("mongoose")

const PrivateChatClusterSchema = new mongoose.Schema(
    {
        pair: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required : true
        }],
        chat: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PrivateChat"
            }
        ]
    }
)

module.exports = mongoose.model("PrivateChatCluster", PrivateChatClusterSchema)