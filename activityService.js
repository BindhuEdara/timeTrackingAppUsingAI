// activityService.js
import { db } from "./firebaseInit.js";
import {
  ref,
  get,
  set,
  update,
  remove,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { v4 as uuidv4 } from "https://jspm.dev/uuid"; // lightweight import for uuid

const MAX_MINUTES = 1440;

function dateKeyFromDateString(dateString) {
  // dateString format YYYY-MM-DD
  return dateString;
}

export async function getDay(uid, dateKey) {
  const dayRef = ref(db, `users/${uid}/days/${dateKey}`);
  const snap = await get(dayRef);
  if (!snap.exists()) return null;
  return snap.val();
}

/**
 * Add activity with transaction to ensure total <= 1440.
 * @param {string} uid
 * @param {string} dateKey YYYY-MM-DD
 * @param {{title:string, category:string, minutes:number}} activity
 */
export async function addActivity(uid, dateKey, activity) {
  if (!activity.title || !activity.minutes || activity.minutes <= 0) {
    throw new Error("Invalid activity");
  }
  const dayRef = ref(db, `users/${uid}/days/${dateKey}`);

  await runTransaction(dayRef, (current) => {
    if (current === null) {
      // create fresh day object
      if (activity.minutes > MAX_MINUTES) {
        throw new Error(`Cannot add. More than ${MAX_MINUTES} minutes`);
      }
      const id = uuidv4();
      return {
        totalMinutes: activity.minutes,
        activities: {
          [id]: {
            id,
            title: activity.title,
            category: activity.category || "Other",
            minutes: activity.minutes,
          },
        },
        updatedAt: Date.now(),
      };
    } else {
      const currentTotal = current.totalMinutes || 0;
      const newTotal = currentTotal + activity.minutes;
      if (newTotal > MAX_MINUTES) {
        throw new Error(
          `Cannot add. Only ${MAX_MINUTES - currentTotal} minutes left`
        );
      }
      const id = uuidv4();
      const newActivities = current.activities || {};
      newActivities[id] = {
        id,
        title: activity.title,
        category: activity.category || "Other",
        minutes: activity.minutes,
      };
      current.totalMinutes = newTotal;
      current.activities = newActivities;
      current.updatedAt = Date.now();
      return current;
    }
  });
}

/**
 * Edit an activity (transaction)
 */
export async function editActivity(uid, dateKey, activityId, updatedFields) {
  const dayRef = ref(db, `users/${uid}/days/${dateKey}`);
  await runTransaction(dayRef, (current) => {
    if (!current) throw new Error("No data for day");
    const activities = current.activities || {};
    const existing = activities[activityId];
    if (!existing) throw new Error("Activity not found");
    const oldMinutes = existing.minutes || 0;
    const newMinutes =
      typeof updatedFields.minutes === "number"
        ? updatedFields.minutes
        : oldMinutes;
    const tentativeTotal =
      (current.totalMinutes || 0) - oldMinutes + newMinutes;
    if (tentativeTotal > MAX_MINUTES) {
      throw new Error(
        `Cannot update. Only ${
          MAX_MINUTES - (current.totalMinutes || 0) + oldMinutes
        } minutes left`
      );
    }
    // update fields
    activities[activityId] = {
      ...existing,
      ...updatedFields,
      minutes: newMinutes,
    };
    current.activities = activities;
    current.totalMinutes = tentativeTotal;
    current.updatedAt = Date.now();
    return current;
  });
}

/**
 * Delete an activity
 */
export async function deleteActivity(uid, dateKey, activityId) {
  const dayRef = ref(db, `users/${uid}/days/${dateKey}`);
  await runTransaction(dayRef, (current) => {
    if (!current) throw new Error("No data for day");
    const activities = current.activities || {};
    const existing = activities[activityId];
    if (!existing) throw new Error("Activity not found");
    const oldMinutes = existing.minutes || 0;
    delete activities[activityId];
    current.activities = activities;
    current.totalMinutes = (current.totalMinutes || 0) - oldMinutes;
    current.updatedAt = Date.now();
    // if no activities left, you may decide to return null (delete node) or keep empty. We'll keep empty object.
    return current;
  });
}
