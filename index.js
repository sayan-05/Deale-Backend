const express = require('express')
const app = express()
const server = require("http").createServer(app)
const mongoose = require('mongoose')
const io = require("socket.io")(server)
const jwt = require('jsonwebtoken')

require("dotenv/config")


app.use(express.json())

const postRoute = require('./routes/post')

app.use('/post', postRoute)

const getRoute = require('./routes/get')

app.use('/get', getRoute)

//SOCKET.IO LOGIC

io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, process.env.TOKEN_SECRET, function (err, decoded) {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded;
            next();
        }
        )
    } else {
        next(new Error('Authentication error...Token Not Found'))
    }
}
).on("connection", (socket) => {
    console.log(socket.decoded)
})

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
    .then(() => {
        console.log('MongoDB Connected…')
    })
    .catch(err => console.log(err))



server.listen(8000, () => console.log('Server is running'))