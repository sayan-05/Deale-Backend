const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { ObjectID } = require("mongodb").ObjectID


const router = express.Router()

router.get('/users', auth, async (req, res) => {
    console.log('req.user')
    data = await User.find(
        {
            _id: {
                $nin: [ObjectID(req.user._id)]
            }
        },(err,docs) => console.log(err))
    res.send(data)
})



module.exports = router