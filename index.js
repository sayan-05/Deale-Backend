const express = require('express')
const app = express()
const server = require("http").createServer(app)
const mongoose = require('mongoose')
const io = require("socket.io")(server)
const jwt = require('jsonwebtoken')
const PrivateChat = require("./models/PrivateChat")
const User = require("./models/User")
const ObjectId = require("mongodb").ObjectID
const PrivateChatCluster = require("./models/PrivateChatCluster")
const GroupChatCluster = require("./models/GroupChatCluster")
const GroupChat = require("./models/GroupChat")
require("dotenv/config")


app.use(express.json())

const postRoute = require('./routes/post')

app.use('/post', postRoute)


const getRoute = require('./routes/get')
const { constants } = require('buffer')

app.use('/get', getRoute)


// DATABASE
mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
    .then(() => {
        console.log('MongoDB Connected…')
    })
    .catch(err => console.log(err))


//SOCKET.IO LOGIC
const activeUsers = {}

io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
        try {
            let decoded = jwt.verify(socket.handshake.query.token, process.env.TOKEN_SECRET)
            socket.decoded = decoded
            next()
        } catch (error) {
            next(new Error("Authentication Error"))
        }

    } else {
        next(new Error('Authentication error...Token Not Found'))
    }
}
).on("connection", async (socket) => {
    let uniqueSocketId = socket.id
    let userId = socket.decoded._id

    activeUsers[uniqueSocketId] = userId

    const friends = await User.findById({
        _id: userId
    }).select("friends -_id")

    const groups = await GroupChatCluster.find({
        members: userId
    }).select("_id")

    const groupsArray = groups.map(i => String(i._id))

    socket.friends = friends.friends

    socket.groups = groupsArray

    socket.join(groupsArray)

    socket.on("send-private-message", async (data) => {


        const recieverId = data.recieverId
        const chatObj = data.chatObj
        const isActive = Object.values(activeUsers).includes(recieverId.toString())
        if (isActive && socket["friends"].includes(recieverId)) {
            let recieverSocketId = Object.keys(activeUsers).find(key => activeUsers[key] === recieverId)
            socket.to(recieverSocketId).emit("recieve-private-message", {
                chatObj: chatObj, sender: userId
            })

            const privateChat = PrivateChat({
                _id: ObjectId(chatObj._id),
                user: ObjectId(userId),
                text: chatObj.text
            })

            await privateChat.save()

            await PrivateChatCluster.findOneAndUpdate(
                {
                    pair: {
                        $all: [userId, recieverId]
                    }
                }, {
                $push: {
                    chat: ObjectId(chatObj._id)
                }
            }
            )

        } else {
            console.log("Inactive")
        }
    })

    socket.on("send-group-message", async (data) => {
        const groupId = data.groupId
        const chatObj = data.chatObj

        if (socket["groups"].includes(groupId)) {
            socket.broadcast.to(groupId).emit("recieve-group-message", {
                groupId: groupId,
                chatObj: chatObj
            })
            const groupChat = GroupChat({
                _id: ObjectId(chatObj._id),
                user: ObjectId(userId),
                text: chatObj.text
            })

            await groupChat.save()

            await GroupChatCluster.findByIdAndUpdate(groupId, {
                $push: {
                    chat: ObjectId(chatObj._id)
                }
            })
        } else {
            console.log(typeof socket.groups[0])
        }

    })


    socket.on("disconnect", () => {
        console.log("Disconnected")
        delete activeUsers[uniqueSocketId]
        console.log(activeUsers)
    })
})




server.listen(8000, () => console.log('Server is running'))

