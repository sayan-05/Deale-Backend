const express = require('express')
const router = express.Router()
const User = require('../models/User')
const {ObjectID} = require("mongodb").ObjectID

router.post('/create-user', (req, res) => {
    user = User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
    })
    user.save()
    res.send('successful')
})

router.post('/user-friends', (req, res) => {
    User.find(
        { _id: req.body._id },
        (err, docs) => {
            if (err) {
                res.send(err)
            } else {
                res.send(docs)
            }
        })
})

router.post('/add-friend', (req, res) => {
    User.findOneAndUpdate(
        { _id: req.body._id }, {
        $addToSet: {
            friends: ObjectID(req.body.friend_id)
        }
    },(err,docs) => {
        res.send("Added to friend list")
    }
    )
})


router.post('/remove-friend', (req, res) => {
    User.findOneAndUpdate(
        { _id: req.body._id }, {
        $pull : {
            friends : ObjectID(req.body.friend_id)
        }
    },(err,docs) => {
        res.send("Removed to friend list")
    }
    )
})



module.exports = router