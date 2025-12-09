// ui.js
import { auth } from "./firebaseInit.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getDay,
  addActivity,
  editActivity,
  deleteActivity,
} from "./activityService.js";

export function setupAppUI() {
  const datePicker = document.getElementById("date-picker");
  const addBtn = document.getElementById("add-activity-btn");
  const titleInput = document.getElementById("activity-title");
  const minutesInput = document.getElementById("activity-minutes");
  const categorySelect = document.getElementById("activity-category");
  const activitiesList = document.getElementById("activities-list");
  const totalHours = document.getElementById("total-hours");
  const remainingMinutesEl = document.getElementById("remaining-minutes");
  const analyseBtn = document.getElementById("analyse-btn");
  const noDataEl = document.getElementById("no-data");
  const charts = document.getElementById("charts");
  const summaryEl = document.getElementById("summary");
  const detailsEl = document.getElementById("details");
  const pieCanvas = document.getElementById("pie");

  let currentUID = null;
  let currentDayData = null;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUID = user.uid;
      // load for selected date
      loadForDate(datePicker.value || new Date().toISOString().slice(0, 10));
    } else {
      currentUID = null;
      currentDayData = null;
      renderEmpty();
    }
  });

  datePicker.addEventListener("change", () => {
    if (!currentUID) return;
    loadForDate(datePicker.value);
  });

  addBtn.addEventListener("click", async () => {
    if (!currentUID) return alert("Sign in first");
    const minutes = parseInt(minutesInput.value, 10);
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    if (!title || !minutes || minutes <= 0)
      return alert("Enter valid title and minutes > 0");
    try {
      await addActivity(currentUID, datePicker.value, {
        title,
        category,
        minutes,
      });
      titleInput.value = "";
      minutesInput.value = "";
      await loadForDate(datePicker.value);
    } catch (err) {
      alert(err.message || "Failed to add");
    }
  });

  analyseBtn.addEventListener("click", () => {
    if (!currentDayData) return;
    renderDashboard(currentDayData);
  });

  async function loadForDate(dateKey) {
    // dateKey in format YYYY-MM-DD
    currentDayData = await getDay(currentUID, dateKey);
    renderDay(currentDayData);
  }

  function renderEmpty() {
    activitiesList.innerHTML = "";
    totalHours.textContent = "Total: 0m";
    remainingMinutesEl.textContent = "You have 1440 minutes left";
    analyseBtn.disabled = true;
    charts.classList.add("hidden");
    noDataEl.innerHTML = "";
  }

  function renderDay(day) {
    activitiesList.innerHTML = "";
    if (!day || !day.activities || Object.keys(day.activities).length === 0) {
      // No data available view
      totalHours.textContent = "Total: 0m";
      remainingMinutesEl.textContent = "You have 1440 minutes left";
      analyseBtn.disabled = true;
      charts.classList.add("hidden");
      noDataEl.innerHTML = `
        <div style="text-align:center; padding:24px;">
          <div style="font-size:40px">📭</div>
          <h3>No data available</h3>
          <p class="small">Start logging your day now — add activities for this date.</p>
        </div>
      `;
      return;
    }

    // render activities list
    const activities = Object.values(day.activities || {});
    let total =
      day.totalMinutes || activities.reduce((s, a) => s + (a.minutes || 0), 0);
    totalHours.textContent = `Total: ${total}m (${Math.floor(total / 60)}h ${
      total % 60
    }m)`;
    remainingMinutesEl.textContent = `You have ${
      1440 - total
    } minutes left for this day`;
    analyseBtn.disabled = total === 0; // enable when any minutes logged; per spec enable when up to 1440 (<=1440)
    noDataEl.innerHTML = "";

    activities.forEach((a) => {
      const div = document.createElement("div");
      div.className = "activity";
      div.innerHTML = `
        <div>
          <div style="font-weight:600">${a.title}</div>
          <div class="small">${a.category}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center">
          <div class="small">${a.minutes}m</div>
          <button class="btn ghost edit" data-id="${a.id}">Edit</button>
          <button class="btn danger delete" data-id="${a.id}" style="background:transparent;border:1px solid #fca5a5;color:#dc2626;padding:6px 8px;border-radius:8px">Delete</button>
        </div>
      `;
      activitiesList.appendChild(div);
    });

    // attach edit/delete handlers (delegation)
    activitiesList.querySelectorAll(".delete").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = btn.dataset.id;
        if (!confirm("Delete this activity?")) return;
        try {
          await deleteActivity(currentUID, datePicker.value, id);
          await loadForDate(datePicker.value);
        } catch (err) {
          alert(err.message || "Delete failed");
        }
      };
    });

    activitiesList.querySelectorAll(".edit").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = btn.dataset.id;
        // simple prompt-based edit for this demo
        const act = day.activities[id];
        const newTitle = prompt("Title", act.title);
        const newMinutes = parseInt(prompt("Minutes", act.minutes), 10);
        if (!newTitle || !newMinutes || newMinutes <= 0)
          return alert("Invalid input");
        try {
          await editActivity(currentUID, datePicker.value, id, {
            title: newTitle,
            minutes: newMinutes,
          });
          await loadForDate(datePicker.value);
        } catch (err) {
          alert(err.message || "Edit failed");
        }
      };
    });

    // keep day data in memory for Analyse / dashboard
    currentDayData = day;
    // hide charts until Analyse clicked
    charts.classList.add("hidden");
  }

  function renderDashboard(day) {
    charts.classList.remove("hidden");
    // summary
    const total = day.totalMinutes || 0;
    summaryEl.innerHTML = `<strong>Total: ${total}m (${Math.floor(
      total / 60
    )}h ${total % 60}m)</strong>
      <div class="small">Activities: ${
        Object.keys(day.activities || {}).length
      }</div>`;

    // category totals
    const catTotals = {};
    for (const a of Object.values(day.activities || {})) {
      const cat = a.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + (a.minutes || 0);
    }

    // details
    detailsEl.innerHTML =
      `<h4>Details</h4>` +
      Object.values(day.activities || {})
        .map((a) => {
          return `<div style="padding:8px;border-bottom:1px solid #f3f4f6"><strong>${a.title}</strong> — ${a.category} — ${a.minutes}m</div>`;
        })
        .join("");

    // simple pie chart drawing on canvas
    drawPieChart(pieCanvas, catTotals);
  }

  function drawPieChart(canvas, catTotals) {
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    ctx.clearRect(0, 0, w, h);
    const entries = Object.entries(catTotals);
    if (entries.length === 0) {
      ctx.fillStyle = "#edf2ff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#374151";
      ctx.fillText("No data", w / 2 - 20, h / 2);
      return;
    }
    const total = entries.reduce((s, [, v]) => s + v, 0);
    let start = -0.5 * Math.PI;
    const palette = [
      "#4f46e5",
      "#06b6d4",
      "#f97316",
      "#ef4444",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
    ];
    entries.forEach(([cat, val], i) => {
      const slice = (val / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2);
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 10, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = palette[i % palette.length];
      ctx.fill();
      start += slice;
    });

    // legend
    let y = 10;
    ctx.font = "12px sans-serif";
    entries.forEach(([cat, val], i) => {
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(10, y, 12, 12);
      ctx.fillStyle = "#111827";
      ctx.fillText(
        `${cat} — ${val}m (${((val / total) * 100).toFixed(1)}%)`,
        30,
        y + 10
      );
      y += 18;
    });
  }
}
