//Imports
const express = require('express')
const router = express.Router()
const User = require('../models/User')
const ObjectID = require("mongodb").ObjectID
const bcrypt = require("bcrypt")
const { body, validationResult } = require("express-validator")
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const PrivateChatCluster = require("../models/PrivateChatCluster")
const GroupChatCluster = require("../models/GroupChatCluster")
const GroupChat = require("../models/GroupChat")


// Route for registering new users
router.post(
    '/register',
    //Validation
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("firstName").isLength({ min: 1 }),
    body("lastName").isLength({ min: 1 }),
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        user = User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            avatar: req.body.avatar
        })

        // Password Hashing
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)

        // Saving model
        await user.save().then(
            (docs) => res.status(200)
        ).catch(
            (err) => console.log(err)
        )
    })

//Route for user login
router.post(
    '/login',
    body("email").isEmail(),
    body("password").isLength({ min: 4 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        user = await User.findOne(
            { email: req.body.email }
        )
        if (!user) return res.status(400).send("Account not found")

        const validPass = bcrypt.compare(req.body.password, user.password)
        if (!validPass) return res.status(400).send("Invalid Password")

        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET)

        res.send(token)

    }
)
//Route for adding new friends
router.post('/add-friend', auth, async (req, res) => {


    await User.findOneAndUpdate(
        {
            _id: req.user._id
        }, {
        $addToSet: {
            friends: req.body.friendId
        }
    }
    )
    await User.findOneAndUpdate(
        {
            _id: req.body.friendId
        }, {
        $addToSet: {
            friends: req.user._id
        }
    }, (err, docs) => {
        res.send("Added to friend list")
    }
    )
    const chatCluster = PrivateChatCluster({
        pair: [ObjectID(req.user._id), ObjectID(req.body.friendId)]
    })
    await chatCluster.save()
})

// Route for removing friend from friend list
router.post('/remove-friend', auth, async (req, res) => {
    await User.findOneAndUpdate(
        { _id: req.body._id }, {
        $pull: {
            friends: ObjectID(req.body.friend_id)
        }
    }, (err, docs) => {
        res.send("Removed from friend list")
    }
    )
})

router.post("/create-group", auth, async (req, res) => {

    const checker = (arr, target) => target.every(v => arr.includes(v))

    const members = req.body.members
    //Fetching info for admin of group 
    const admin = await User.findById(req.user._id).select("friends firstName lastName _id").populate(
        {
            path: "friends",
            select: "firstName lastName _id",
            match: {
                _id: {
                    $in: members
                }
            }
        })
    //Generating sys messages for the users who are added    
    const iniSysMsg = admin.friends.map(i => {
        return {
            _id: ObjectID(),
            text: i.firstName + " " + i.lastName + " " + "was added to group",
            system: true
        }
    })
    //Appending msg about who created the group
    iniSysMsg.unshift({
        _id: ObjectID(),
        text: admin.firstName + " " + admin.lastName + " " + "created the group",
        system: true
    })
    //Uploading the messages
    const iniSysMsgUpload = await GroupChat.insertMany(iniSysMsg)
    //Fetching the _id of sys messages
    const iniSysMsgId = iniSysMsgUpload.map(i => i._id)

    const friendsId = admin.friends.map(i => String(i._id))

    if (checker(friendsId, members)) {
        members.push(req.user._id)
        const GroupCluster = GroupChatCluster({
            _id: ObjectID(),
            name: req.body.name,
            members: members,
            admin: req.user._id,
            chat: iniSysMsgId
        })
        await GroupCluster.save()

        const newCluster = await GroupChatCluster.findById(GroupCluster._id).select("-__v").populate({
            path : "chat",
            select : '-__v',
            options : {
                sort : {
                    "createdAt":-1
                }
            }
        })
        res.send(newCluster)

    } else {
        res.send("Something went wrong")
    }


})

router.post("/test", auth, async (req, res) => {
    const checker = (arr, target) => target.every(v => arr.includes(v))

    const members = req.body.members
    try {
        const admin = await User.findById(req.user._id).select("friends firstName lastName _id").populate(
            {
                path: "friends",
                select: "firstName lastName _id",
                match: {
                    _id: {
                        $in: members
                    }
                }
            })
        res.send(admin)
    } catch (err) {
        console.log(err)
    }
})



module.exports = router