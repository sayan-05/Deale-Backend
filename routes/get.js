const express = require('express')
const User = require('../models/User')
const auth = require('../middleware/auth')
const router = express.Router()
const PrivateChatCluster = require("../models/PrivateChatCluster")
const GroupChatCluster = require("../models/GroupChatCluster")


router.get('/people', auth, async (req, res) => {
    let userFriends = await User.findById(req.user._id).select("friends -_id")
    userFriends = userFriends.friends
    userFriends.push(req.user._id)

    let data = await User.find(
        {
            _id: {
                $nin: userFriends
            },
        }).select("firstName lastName _id avatar")
    res.send(data)
})

router.get('/friends', auth, async (req, res) => {
    let friends = await User.findById(
        {
            _id: req.user._id
        }
    ).populate("friends", "firstName lastName _id avatar").select("friends -_id")
    res.send(friends.friends)
})

router.get('/private-chats', auth, async (req, res) => {
    let chatFriends = await PrivateChatCluster.find({
        pair: req.user._id
    })
        .select("pair chat")
        .populate("pair", "firstName lastName _id avatar")
        .populate({
            path: "chat",
            select: '-__v',
            options: {
                sort: {
                    "createdAt": -1
                }
            },
            populate: {
                path: "user",
                select: '_id'
            }
        })


    chatFriends.forEach((i) => {
        i.pair.forEach((j, index) => {
            if (j._id == req.user._id) {
                i.pair.splice(index, 1)
            }
        })
    })

    let userId = req.user._id


    res.send({ chatFriends, userId })
})

router.get("/group-chats", auth, async (req, res) => {
    const groupChats = await GroupChatCluster.find({
        members: req.user._id
    }).populate({
        path: "chat",
        select: '-__v',
        options: {
            sort: {
                "createdAt": -1
            }
        },
        populate: {
            path: "user",
            select: '_id'
        }
    }).populate({
        path: "members",
        select : '_id firstName lastName avatar'
    })
        .select("-__v")

    res.send(groupChats)
})


module.exports = router