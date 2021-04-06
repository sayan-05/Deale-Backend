const express = require('express')
const app = express()
const server = require("http").createServer(app)
const mongoose = require('mongoose')
const io = require("socket.io")(server)
const jwt = require('jsonwebtoken')
const PrivateChat = require("./models/PrivateChat")
const ObjectId = require("mongodb").ObjectID

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
).on("connection", (socket) => {
    let uniqueSocketId = socket.id
    let publicUserId = socket.decoded.publicId

    activeUsers[uniqueSocketId] = publicUserId


    socket.on("send-private-message", async (data) => {

        const recieverPublicId = data.publicId
        const text = data.recvText
        const isActive = Object.values(activeUsers).includes(recieverPublicId.toString())
        if (isActive) {
            let recieverSocketId = Object.keys(activeUsers).find(key => activeUsers[key] === recieverPublicId)
            socket.to(recieverSocketId).emit("recieve-private-message", {
                text: text, sender: publicUserId
            })
            const chatSave = PrivateChat(
                {
                    sender: ObjectId(publicUserId),
                    reciever: ObjectId(recieverPublicId),
                    text: text
                }
            )
            await chatSave.save()
        }
    })

    socket.on("disconnect", () => {
        console.log(activeUsers)
        console.log("Disconnected")
        delete activeUsers[uniqueSocketId]
    })
})




server.listen(8000, () => console.log('Server is running'))

