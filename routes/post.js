//Imports
const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { ObjectID } = require("mongodb").ObjectID
const bcrypt = require("bcrypt")
const { body, validationResult } = require("express-validator")
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')


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
        })

        // Password Hashing
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
        // Saving model
        await user.save().then(
            (docs) => res.status(200).send(docs)
        ).catch(
            (err) => res.send(err)
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

        const token = jwt.sign({_id : user._id},process.env.TOKEN_SECRET)

        res.header('auth-token',token).send(token)

    }
)
//Route for adding new friends
router.post('/add-friend',auth , (req, res) => {
    User.findOneAndUpdate(
        { _id: req.body._id }, {
        $addToSet: {
            friends: ObjectID(req.body.friend_id)
        }
    }, (err, docs) => {
        res.send("Added to friend list")
    }
    )
})

// Route for removing friend from friend list
router.post('/remove-friend', (req, res) => {
    User.findOneAndUpdate(
        { _id: req.body._id }, {
        $pull: {
            friends: ObjectID(req.body.friend_id)
        }
    }, (err, docs) => {
        res.send("Removed from friend list")
    }
    )
})



module.exports = router