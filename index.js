const express = require('express')
const app = express()
const server = require("http").createServer(app)
const mongoose = require('mongoose')
const io = require("socket.io")(server)

require("dotenv/config")


app.use(express.json())

const postRoute = require('./routes/post')

app.use('/post', postRoute)

const getRoute = require('./routes/get')

app.use('/get', getRoute)

io.use((socket, next) => {
    if (!socket.handshake.query.token) return next(new Error("Authentication Error....Token Missing"))
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        socket.verified = verified
        next()
    } catch{
        next(new Error("Authentication Error"))
    }
}).on("connection",(socket)=> {
    console.log("Connected")
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