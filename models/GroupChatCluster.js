const mongoose = require("mongoose")

const GroupChatClusterSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
        admin: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GroupChat",
                required: true
            }
        ],
        chat: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GroupChat"
            }
        ]
    }
)

module.exports = mongoose.model("GroupChatCluster", GroupChatClusterSchema)