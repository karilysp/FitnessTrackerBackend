const client = require("./client");

async function addActivityToRoutine({
  routineId,
  activityId,
  count,
  duration,
}) {
  try {
    const {
      rows: [routine_activity],
    } = await client.query(
      `
      INSERT INTO routine_activities ("routineId", "activityId", count, duration)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("routineId", "activityId") DO NOTHING
      RETURNING *;
    `,
      [routineId, activityId, count, duration]
    );

    return routine_activity;
  } catch (error) {
    console.error(error);
  }
}

async function getRoutineActivityById(id) {
  try {
    const {
      rows: [routine_activity],
    } = await client.query(
      `
      SELECT * 
      FROM routine_activities
      WHERE id=$1;
      `,
      [id]
    );
    return routine_activity;
  } catch (error) {
    console.log(error)
    throw error;
  }
}

async function getRoutineActivitiesByRoutine({ id }) {
  try {
    const { rows: routine_activity } = await client.query(
      `
      SELECT routine_activities.* 
      FROM routine_activities
      JOIN routines ON routine_activities."routineId"=routines.id
      WHERE "routineId"=$1;
      `,
      [id]
    );
    return routine_activity;
  } catch (error) {
    console.log(error);
  }
}

async function updateRoutineActivity({ id, ...fields }) {
  {
    const setString = Object.keys(fields)
      .map((key, index) => `"${key}"=$${index + 1}`)
      .join(", ");
    if (setString.length === 0) {
      return;
    }
    try {
      const {
        rows: [activity],
      } = await client.query(
        `
    UPDATE routine_activities
    SET ${setString}
    WHERE id=${id}
    RETURNING *;
    `,
        Object.values(fields)
      );
      return activity;
    } catch (error) {
      console.error(error);
    }
  }
}

async function destroyRoutineActivity(id) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `
      DELETE 
      FROM routine_activities
      WHERE id=${id}
      RETURNING *
    `
    );

    return activity;
  } catch (error) {
    console.error(error);
  }
}

async function canEditRoutineActivity(routineActivityId, userId) {
  try {
    const {
      rows: [activity],
    } = await client.query(
      `SELECT * 
    FROM routine_activities
    JOIN routines ON routine_activities."routineId"=routines.id
    WHERE routine_activities.id=${routineActivityId};
    `
    );

    if (activity.creatorId === userId) {
      return activity;
    } else return;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  getRoutineActivityById,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  updateRoutineActivity,
  destroyRoutineActivity,
  canEditRoutineActivity,
};