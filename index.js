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
    const userId = socket.decoded._id

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
                $addToSet: {
                    chat: ObjectId(chatObj._id)
                }
            }
            )

        } else {
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
                $addToSet: {
                    chat: ObjectId(chatObj._id)
                }
            }
            )
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
                $addToSet: {
                    chat: ObjectId(chatObj._id)
                }
            })
        }
    })

    socket.on("remove-from-group", async (data) => {
        const removedId = data.removedId
        const groupId = data.groupId
        const removedSocketId = Object.keys(activeUsers).find(key => activeUsers[key] === removedId)
        const isAdmin = await GroupChatCluster.find({
            _id: groupId,
            admin: userId
        }).countDocuments()
        if (isAdmin === 1) {
            const removedSocketInstance = await io.in(removedSocketId).fetchSockets()
            const removedUser = await User.findById(removedSocketInstance[0]["decoded"]._id).select("-_id firstName lastName")
            const groupChat = GroupChat({
                _id: ObjectId(),
                text: `${removedUser["firstName"]} ${removedUser["lastName"]} was removed by Admin`,
                system : true
            })

            await groupChat.save()

            const removalSysMsg = await GroupChat.findById(groupChat._id).select("-__v")

            socket.in(groupId).emit("mem-removed-from-group", {
                groupId: groupId,
                chatObj: removalSysMsg
            })

            removedSocketInstance[0]["groups"] = removedSocketInstance[0]["groups"].filter(i => i != groupId)

            await GroupChatCluster.findByIdAndUpdate(groupId,{
                $pull : {
                    members : removedId
                }
            })

            await GroupChatCluster.findByIdAndUpdate(groupId, {
                $addToSet: {
                    chat: ObjectId(groupChat._id)
                }
            })
        }
    })

    socket.on("disconnect", () => {
        console.log("Disconnected")
        delete activeUsers[uniqueSocketId]
        console.log(activeUsers)
    })
})


server.listen(8000, () => console.log('Server is running'))


