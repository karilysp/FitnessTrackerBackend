const express = require("express");
const {
    getAllPublicRoutines,
    createRoutine,
    getRoutineById,
    updateRoutine,
    destroyRoutine,
    addActivityToRoutine,
} = require("../db");
const {
    UnauthorizedUpdateError,
    UnauthorizedDeleteError,
    DuplicateRoutineActivityError,
} = require("../errors");
const { requireUser } = require("./Utils");
const router = express.Router();

// GET /api/routines

router.get("/", async (req, res, next) => {
    try {
        const allPublicRoutines = await getAllPublicRoutines();
        res.send(allPublicRoutines);
    } catch (error) {
        next(error);
    }
});

// POST /api/routines
router.post("/", requireUser, async (req, res, next) => {
    const { isPublic, name, goal } = req.body;
    const creatorId = req.user.id;

    try {
        if (!req.user) {
            next({
                name: "Requires logged in user",
                message: "you must be logged in to perform this action",
            });
        } else {
            const postRoutine = await createRoutine({
                creatorId,
                isPublic,
                name,
                goal,
            });
            if (postRoutine) {
                res.send(postRoutine);
            } else {
                next({
                    message:
                        "message: 'An error was encountered trying to create routine. Please try again.",
                });
            }
        }
    } catch (error) {
        next(error);
    }
});

// PATCH /api/routines/:routineId

router.patch("/:routineID", requireUser, async (req, res, next) => {
    const { name, goal, isPublic } = req.body;
    const routineId = req.params.routineID;
    const id = req.user.id;
    try {
        const checkRoutineId = await getRoutineById(routineId);
        if (checkRoutineId === id) {
            const updateRo = updateRoutine({ routineId, isPublic, name, goal });
            res.send(updateRo);
        } else {
            res.status(403).send(
                checkRoutineId
                    ? {
                        message: UnauthorizedUpdateError(
                            req.user.username,
                            checkRoutineId.name
                        ),
                        name: "UnauthorizedUpdateError",
                        error: "UnauthorizedUpdateError",
                    }
                    : {
                        error: "RoutineNotFoundError",
                        message: "Routine not found",
                        name: "RoutineNotFoundError",
                    }
            );
        }
    } catch (error) {
        next(error);
    }
});

// DELETE /api/routines/:routineId
router.delete("/:routineId", requireUser, async (req, res, next) => {
    const routineId = req.params.routineId;
    const id = req.user.id;
    try {
        const checkRoutineId = await getRoutineById(routineId);

        if (checkRoutineId) {
            if (checkRoutineId.creatorId !== id) {
                res.status(403).send({
                    name: "UnauthorizedPermissionError",
                    message: UnauthorizedDeleteError(
                        req.user.username,
                        checkRoutineId.name
                    ),
                    error: "UnauthorizedUpdateError",
                });
            } else {
                await destroyRoutine(routineId);
                res.send(checkRoutineId);
            }
        }
    } catch (error) {
        next(error);
    }
});

// POST /api/routines/:routineId/activities

router.post("/:routineId/activities", requireUser, async (req, res, next) => {
    const routineId = req.params.routineId;
    const { activityId, count, duration } = req.body;
    try {
        const routineActivity = await addActivityToRoutine({
            routineId,
            activityId,
            count,
            duration,
        });
        if (routineActivity) {
            res.send(routineActivity);
        } else {
            next({
                name: "creationError",
                message: DuplicateRoutineActivityError(routineId, activityId),
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
