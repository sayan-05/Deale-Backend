const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { ObjectID } = require("mongodb").ObjectID


const router = express.Router()

router.get('/users', auth, async (req, res) => {
    let userFriends = await User.findById(req.user._id).select("friends -_id")
    userFriends = userFriends.friends
    convertedUserFriends = userFriends.map(
        x => ObjectID(x)
    )
    let data = await User.find(
        {
            _id: {
                $nin: [ObjectID(req.user._id)]
            },
            publicId : {
                $nin : convertedUserFriends
            }
        }, { password: 0, _id: 0, email: 0, joined: 0, active : 0 })
    res.send(data)
})





module.exports = router