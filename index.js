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

io.on('connection', (client) => {
    
    console.log("Client connected")

    client.on('join', (data) => {
        console.log(data)
    })
})

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify : false
})
    .then(() => {
        console.log('MongoDB Connected…')
    })
    .catch(err => console.log(err))



server.listen(3000, () => console.log('Server is running'))