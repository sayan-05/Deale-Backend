const express = require('express')
const User = require('../models/User')


const router = express.Router()

router.get('/', (req, res) => {
    res.send('<h1>I am Sayan</h1>')
})



module.exports = router