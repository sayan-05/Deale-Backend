const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const mongoose = require("mongoose")

const router = express.Router()

router.get('/users', auth, async (req, res) => {
    let userFriends = await User.findById(req.user._id).select("friends -_id")
    userFriends = userFriends.friends
    userFriends.push(req.user._id)
    convertedUserFriends = userFriends.map(
        x => mongoose.Types.ObjectId(x)
    )
    let data = await User.find(
        {
            _id: {
                $nin: convertedUserFriends
            },
        }, { password: 0,email: 0, joined: 0, active : 0 })
    res.send(data)
})





module.exports = router