const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const router = express.Router()
const PrivateChatCluster = require("../models/PrivateChatCluster")

router.get('/users', auth, async (req, res) => {
    let userFriends = await User.findById(req.user._id).select("friends -_id")
    userFriends = userFriends.friends
    userFriends.push(req.user._id)

    let data = await User.find(
        {
            _id: {
                $nin: userFriends
            },
        }).select("firstName lastName _id")
    res.send(data)
})

router.get('/friends', auth, async (req, res) => {
    let friends = await User.findById(
        {
            _id: req.user._id
        }
    ).populate("friends", "firstName lastName _id").select("friends -_id")
    res.send(friends.friends)
})

router.get('/chats', auth, async (req, res) => {
    let chatFriends = await PrivateChatCluster.find({
        pair: req.user._id,
        chat: {
            $exists: true,
            $ne: []
        }
    })
        .select("pair chat")
        .populate("pair", "firstName lastName _id")
        .populate({
            path : "chat",
            select : '-__v',
            options : {
                sort : {
                    "createdAt":-1
                }
            },
            populate : {
                path : "user",
                select : '_id'
            }
        })


    chatFriends.forEach((i) => {
        i.pair.forEach((j,index) => {
            if (j._id == req.user._id){
                i.pair.splice(index,1)
            }
        } )
    })

    let userId = req.user._id


    res.send({chatFriends,userId})
})



module.exports = router