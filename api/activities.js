const express = require("express");
const {
    getAllActivities,
    createActivity,
    updateActivity,
    getActivityById,
    getPublicRoutinesByActivity,
} = require("../db");
const { ActivityNotFoundError } = require("../errors");
const { requireUser } = require("./Utils");
const router = express.Router();

// GET /api/activities
router.get("/", async (req, res, next) => {
    try {
        const activities = await getAllActivities();
        res.send(activities);
    } catch (error) {
        next(error);
    }
});

// POST /api/activities
router.post("/", requireUser, async (req, res, next) => {
    const { name, description } = req.body;
    try {
        const newActivity = await createActivity({ name, description });
        if (!newActivity) {
            next({ name, message: `An activity with name ${name} already exists` });
        } else {
            res.send(newActivity);
        }
    } catch (error) {
        next(error);
    }
});

// PATCH /api/activities/:activityId

router.patch("/:activityId", async (req, res, next) => {
    const { name, description } = req.body;
    const id = req.params.activityId;

    try {
        const activityBeforeUpdate = await getActivityById(id);
        if (!activityBeforeUpdate) {
            next({ name: "ActivityNotFound", message: ActivityNotFoundError(id) });
        } else {
            const updatedActivity = await updateActivity({ id, name, description });
            if (updatedActivity) {
                res.send(updatedActivity);
            }
        }
    } catch (error) {
        next({
            name: "NameIsExists",
            message: `An activity with name ${name} already exists`,
        });
    }
});

// GET /api/activities/:activityId/routines
router.get("/:activityId/routines", async (req, res, next) => {
    const id = req.params.activityId;
    try {
        const checkActivity = await getActivityById(id);
        if (checkActivity) {
            const routines = await getPublicRoutinesByActivity({ id });
            res.send(routines);
        } else {
            next({ name: "ActivityIdError", message: ActivityNotFoundError(id) });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;