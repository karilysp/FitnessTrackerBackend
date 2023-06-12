const express = require("express");
const router = express.Router();
const {createUser, getUserByUsername, getUserById, getPublicRoutinesByUser, getAllRoutinesByUser} = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;


//POST /api/users/register
router.post("/register", async (req, res, next) => {
    const { username, password } = req.body;
    const _user = await getUserByUsername(username);
    if (_user) {
        res.send({
            error: 'error',
            name: 'error',
            message: `User ${username} is already taken.`,
        });
    } else if (password.length < 8) {
        res.send({
            error: 'error with password',
            message: "Password Too Short!",
            name: 'error with password',
        });
    } else if (!username) {
        res.send({
            error: "UsernameNullError",
            message: "Name not filled out",
            name: "UsernameNullError",
        });
    } else {
        try {
            const user = await createUser({
                username,
                password
            })
            const token = jwt.sign({
                id: user.id,
                username
            }, JWT_SECRET, {
                expiresIn: '1w'
            });
            res.send({
                user: {
                    id: user.id,
                    username: username
                },
                message: "thank you for signing up",
                token: token,
            });
        } catch ({ name, message }) {
            next({ name, message })
        }
    }
})

router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);
        const hashedPassword = user.password

        if (hashedPassword) {

            const token = jwt.sign({
                id: user.id,
                username: user.username
            }, JWT_SECRET)

            jwt.verify(token, JWT_SECRET)

            res.send({
                message: "you're logged in!",
                token: token,
                user: {
                    id: user.id,
                    username: username
                }
            });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
});

// GET /api/users/me
router.get("/me", async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        res.status(401).send({
            error: "This is an error",
            message: "You must be logged in to perform this action",
            name: "Log in for access"
        })
    } else {
        try {
            const token = authHeader.split(" ")[1]
            const decoded = jwt.verify(token, JWT_SECRET)
            const userId = decoded.id
            const user = await getUserById(userId)

            res.send({
                id: user.id,
                username: user.username
            })
        } catch ({ name, message }) {
            next({ name, message })
        }
    }
})

router.get('/:username/routines', async (req, res, next) => {
    const { username } = req.params
    const authHeader = req.headers.authorization;
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const loggedInUser = decoded.username

        if (loggedInUser !== username) {
            const publicRoutines = await getPublicRoutinesByUser({ username })
            res.send(publicRoutines)
        }
        else if (loggedInUser === username) {
            const routines = await getAllRoutinesByUser({ username })
            res.send(routines)
        }
    } catch ({ name, message }) {
        next({ name, message })
    }
})

module.exports = router;
