const express = require("express");
const {
    getRoutineById,
    updateRoutineActivity,
    getRoutineActivityById,
    canEditRoutineActivity,
    destroyRoutineActivity,
} = require("../db");
const {
    UnauthorizedUpdateError,
    UnauthorizedDeleteError,
} = require("../errors");
const { requireUser } = require("./Utils");
const router = express.Router();

// PATCH /api/routine_activities/:routineActivityId

router.patch("/:routineActivityId", requireUser, async (req, res, next) => {
    const { routineActivityId } = req.params;
    const { count, duration } = req.body;
    const id = req.user.id;
    try {
        const routineToUpdate = await getRoutineActivityById(routineActivityId);
        const routineId = await getRoutineById(routineToUpdate.routineId);

        if (!routineToUpdate) {
            next({ name: "NotFound", message: "no Routine Activity found" });
        }
        const checkUser = await canEditRoutineActivity(routineActivityId, id);
        if (!checkUser) {
            next({
                name: "UpdateActivityError",
                message: UnauthorizedUpdateError(req.user.username, routineId.name),
            });
        } else {
            const updateActivity = await updateRoutineActivity({
                id: routineActivityId,
                count,
                duration,
            });
            res.send(updateActivity);
        }
    } catch (error) {
        next(error);
    }
});

// DELETE /api/routine_activities/:routineActivityId

router.delete("/:routineActivityId", requireUser, async (req, res, next) => {
    const routineActivityId = req.params.routineActivityId;
    const id = req.user.id;
    try {
        const deleteRoutineActivity = await destroyRoutineActivity(
            routineActivityId
        );
        const routineId = await getRoutineById(deleteRoutineActivity.routineId);
        if (id !== routineId.creatorId) {
            res.status(403).send({
                error: "UnauthorizedDeleteError",
                name: "UnauthorizedDeleteError",
                message: UnauthorizedDeleteError(req.user.username, routineId.name),
            });
        } else {
            res.send(deleteRoutineActivity);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;