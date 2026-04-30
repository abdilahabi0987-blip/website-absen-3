// ==================== DATA SISWA ====================
const rawStudents = [
  "Andicka",
  "Arini",
  "Aura Jihan",
  "Daijiro",
  "Devi",
  "Dina",
  "Dinda",
  "Dwi",
  "Fahri",
  "Fauzan",
  "Febri",
  "Gilang",
  "Hoyirum",
  "Indri yani",
  "Julia",
  "laura",
  "M. Alfan",
  "M. Apdilah",
  "M. Ikhsan",
  "M. Pahroji",
  "M. Raihan",
  "M. Suban",
  "M. Zaky",
  "Manda",
  "Melati",
  "Naesya safira",
  "Nailah",
  "Neysa putri",
  "Noni",
  "Nursilfah",
  "Piyantika",
  "Qaira",
  "Ramadhan",
  "Retchika",
  "Ridho",
  "Sela",
  "Siti Aryanih",
  "Siti Nabilah",
  "Soimatul",
  "Sumiyati",
  "Ues",
  "Wildatun",
  "Yosia",
  "Zackiya",
];

const sortedStudents = [...rawStudents].sort((a, b) =>
  a.localeCompare(b, "id", { sensitivity: "base" }),
);

// ==================== GLOBAL VARIABLES ====================
let attendanceToday = {}; // status untuk hari ini (key: nama siswa)
let attendanceHistory = {}; // { "YYYY-MM-DD": { "Nama Siswa": "Hadir/Izin/dll" } }
let currentFilter = "all";
let currentTab = "absen";
let statusChart = null;
let trendChart = null;

// DOM Elements
const tbody = document.getElementById("studentTableBody");
const totalHadirSpan = document.getElementById("totalHadir");
const totalIzinSpan = document.getElementById("totalIzin");
const totalSakitSpan = document.getElementById("totalSakit");
const totalAlpaSpan = document.getElementById("totalAlpa");
const totalSiswaSpan = document.getElementById("totalSiswa");
const resetAllBtn = document.getElementById("resetAllBtn");
const filterBtns = document.querySelectorAll(".filter-btn");
const currentDateSpan = document.getElementById("currentDate");
const tabBtns = document.querySelectorAll(".tab-btn");
const monthPicker = document.getElementById("monthPicker");
const exportBtn = document.getElementById("exportRiwayatBtn");

// ==================== HELPER: DATE ====================
function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function updateDateDisplay() {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const dateString = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  if (currentDateSpan) currentDateSpan.textContent = dateString;
  if (document.getElementById("monthYearLabel")) {
    document.getElementById("monthYearLabel").textContent =
      `${months[now.getMonth()]} ${now.getFullYear()}`;
  }
}

// ==================== LOCAL STORAGE ====================
function loadFromLocalStorage() {
  const savedToday = localStorage.getItem("attendanceToday_Akuntansi2");
  if (savedToday) {
    attendanceToday = JSON.parse(savedToday);
  } else {
    attendanceToday = {};
    sortedStudents.forEach((s) => {
      attendanceToday[s] = null;
    });
  }

  const savedHistory = localStorage.getItem("attendanceHistory_Akuntansi2");
  if (savedHistory) {
    attendanceHistory = JSON.parse(savedHistory);
  } else {
    attendanceHistory = {};
  }

  // Pastikan semua siswa ada di attendanceToday
  sortedStudents.forEach((siswa) => {
    if (attendanceToday[siswa] === undefined) attendanceToday[siswa] = null;
  });
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem(
    "attendanceToday_Akuntansi2",
    JSON.stringify(attendanceToday),
  );
  localStorage.setItem(
    "attendanceHistory_Akuntansi2",
    JSON.stringify(attendanceHistory),
  );
}

// Simpan data hari ini ke history (otomatis saat ganti hari)
function saveTodayToHistory() {
  const today = getTodayString();
  const hasAnyAttendance = Object.values(attendanceToday).some(
    (v) => v !== null,
  );

  if (hasAnyAttendance) {
    attendanceHistory[today] = { ...attendanceToday };
    saveToLocalStorage();
  }
}

// Cek apakah hari berganti, jika ya pindahkan data kemarin ke history
function checkAndArchivePreviousDay() {
  const today = getTodayString();
  const lastSavedDate = localStorage.getItem("lastAttendanceDate");

  if (lastSavedDate && lastSavedDate !== today) {
    // Hari berganti, simpan data kemarin ke history
    const yesterdayData = attendanceToday;
    const hasData = Object.values(yesterdayData).some((v) => v !== null);
    if (hasData) {
      attendanceHistory[lastSavedDate] = { ...yesterdayData };
    }
    // Reset attendanceToday
    attendanceToday = {};
    sortedStudents.forEach((s) => {
      attendanceToday[s] = null;
    });
  }
  localStorage.setItem("lastAttendanceDate", today);
  saveToLocalStorage();
}

// ==================== STATISTIK HARI INI ====================
function updateStats() {
  let hadir = 0,
    izin = 0,
    sakit = 0,
    alpa = 0;
  sortedStudents.forEach((siswa) => {
    const status = attendanceToday[siswa];
    if (status === "Hadir") hadir++;
    else if (status === "Izin") izin++;
    else if (status === "Sakit") sakit++;
    else if (status === "Alpa") alpa++;
  });
  totalHadirSpan.innerText = hadir;
  totalIzinSpan.innerText = izin;
  totalSakitSpan.innerText = sakit;
  totalAlpaSpan.innerText = alpa;
  totalSiswaSpan.innerText = sortedStudents.length;
}

// ==================== RENDER ABSENSI ====================
function renderAbsenTable() {
  let filteredStudents = [...sortedStudents];
  if (currentFilter !== "all") {
    filteredStudents = sortedStudents.filter(
      (siswa) => attendanceToday[siswa] === currentFilter,
    );
  }

  tbody.innerHTML = "";
  filteredStudents.forEach((siswa, idx) => {
    const currentStatus = attendanceToday[siswa] || "";
    const row = document.createElement("tr");

    const noCell = document.createElement("td");
    noCell.innerText = idx + 1;
    row.appendChild(noCell);

    const nameCell = document.createElement("td");
    nameCell.innerText = siswa;
    row.appendChild(nameCell);

    const statuses = ["Hadir", "Izin", "Sakit", "Alpa"];
    const icons = {
      Hadir: '<i class="fas fa-check-circle"></i>',
      Izin: '<i class="fas fa-envelope"></i>',
      Sakit: '<i class="fas fa-notes-medical"></i>',
      Alpa: '<i class="fas fa-ban"></i>',
    };

    statuses.forEach((status) => {
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = `status-btn ${currentStatus === status ? status.toLowerCase() + "-active" : ""}`;
      btn.innerHTML = `${icons[status]} ${status}`;
      btn.addEventListener("click", () => {
        if (attendanceToday[siswa] === status) {
          attendanceToday[siswa] = null;
        } else {
          attendanceToday[siswa] = status;
        }
        saveToLocalStorage();
        updateStats();
        renderAbsenTable();
        updateDashboard();
      });
      td.appendChild(btn);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  if (filteredStudents.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 6;
    emptyCell.style.textAlign = "center";
    emptyCell.style.padding = "2rem";
    emptyCell.innerHTML = "✨ tidak ada siswa dengan status ini ✨";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  }
}

// ==================== DASHBOARD ====================
function getMonthlyStats(monthYear) {
  const [year, month] = monthYear.split("-");
  let stats = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, totalDays: 0 };
  let studentAttendance = {};

  sortedStudents.forEach((s) => {
    studentAttendance[s] = { Hadir: 0, total: 0 };
  });

  Object.keys(attendanceHistory).forEach((date) => {
    if (date.startsWith(`${year}-${month}`)) {
      stats.totalDays++;
      const dayData = attendanceHistory[date];
      sortedStudents.forEach((siswa) => {
        const status = dayData[siswa];
        if (status === "Hadir") {
          stats.Hadir++;
          studentAttendance[siswa].Hadir++;
          studentAttendance[siswa].total++;
        } else if (status === "Izin") {
          stats.Izin++;
          studentAttendance[siswa].total++;
        } else if (status === "Sakit") {
          stats.Sakit++;
          studentAttendance[siswa].total++;
        } else if (status === "Alpa") {
          stats.Alpa++;
          studentAttendance[siswa].total++;
        }
      });
    }
  });

  let topStudent = "-";
  let maxHadir = -1;
  for (const [nama, data] of Object.entries(studentAttendance)) {
    if (data.Hadir > maxHadir && data.total > 0) {
      maxHadir = data.Hadir;
      topStudent = `${nama} (${data.Hadir} hadir)`;
    }
  }

  const totalAbsensi = stats.Hadir + stats.Izin + stats.Sakit + stats.Alpa;
  const avgKehadiran =
    stats.totalDays > 0
      ? (
          (stats.Hadir / (sortedStudents.length * stats.totalDays)) *
          100
        ).toFixed(1)
      : 0;

  return {
    stats,
    totalAbsensi,
    avgKehadiran,
    topStudent,
    totalDays: stats.totalDays,
  };
}

function updateDashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { stats, totalAbsensi, avgKehadiran, topStudent } =
    getMonthlyStats(currentMonth);

  document.getElementById("summaryTotal").innerText = totalAbsensi;
  document.getElementById("summaryAvg").innerText = `${avgKehadiran}%`;
  document.getElementById("topStudent").innerText = topStudent;

  if (statusChart) statusChart.destroy();
  const ctx = document.getElementById("statusChart").getContext("2d");
  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Hadir", "Izin", "Sakit", "Alpa"],
      datasets: [
        {
          data: [stats.Hadir, stats.Izin, stats.Sakit, stats.Alpa],
          backgroundColor: ["#1f7840", "#b96f0f", "#c7362b", "#7f6b5c"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // Trend 7 hari terakhir
  const last7Days = [];
  const trendData = { Hadir: [], Izin: [], Sakit: [], Alpa: [] };
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7Days.push(`${d.getDate()}/${d.getMonth() + 1}`);
    let dayStats = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
    if (attendanceHistory[dateStr]) {
      Object.values(attendanceHistory[dateStr]).forEach((status) => {
        if (status === "Hadir") dayStats.Hadir++;
        else if (status === "Izin") dayStats.Izin++;
        else if (status === "Sakit") dayStats.Sakit++;
        else if (status === "Alpa") dayStats.Alpa++;
      });
    } else if (dateStr === getTodayString()) {
      Object.values(attendanceToday).forEach((status) => {
        if (status === "Hadir") dayStats.Hadir++;
        else if (status === "Izin") dayStats.Izin++;
        else if (status === "Sakit") dayStats.Sakit++;
        else if (status === "Alpa") dayStats.Alpa++;
      });
    }
    trendData.Hadir.push(dayStats.Hadir);
    trendData.Izin.push(dayStats.Izin);
    trendData.Sakit.push(dayStats.Sakit);
    trendData.Alpa.push(dayStats.Alpa);
  }

  if (trendChart) trendChart.destroy();
  const ctxTrend = document.getElementById("trendChart").getContext("2d");
  trendChart = new Chart(ctxTrend, {
    type: "line",
    data: {
      labels: last7Days,
      datasets: [
        {
          label: "Hadir",
          data: trendData.Hadir,
          borderColor: "#1f7840",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Izin",
          data: trendData.Izin,
          borderColor: "#b96f0f",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Sakit",
          data: trendData.Sakit,
          borderColor: "#c7362b",
          tension: 0.3,
          fill: false,
        },
        {
          label: "Alpa",
          data: trendData.Alpa,
          borderColor: "#7f6b5c",
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: "top" } },
    },
  });
}

// ==================== RIWAYAT BULANAN ====================
function renderRiwayat() {
  let selectedMonth = monthPicker.value;
  if (!selectedMonth) {
    const now = new Date();
    selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    monthPicker.value = selectedMonth;
  }

  const [year, month] = selectedMonth.split("-");
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${month}-${String(i).padStart(2, "0")}`;
    dates.push(dateStr);
  }

  // Header
  const thead = document.getElementById("riwayatHeader");
  thead.innerHTML = `<tr><th>Nama Siswa</th>${dates.map((d) => `<th>${d.split("-")[2]}</th>`).join("")}<th>Total Hadir</th></tr>`;

  const tbodyRiwayat = document.getElementById("riwayatBody");
  tbodyRiwayat.innerHTML = "";

  sortedStudents.forEach((siswa) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.innerText = siswa;
    row.appendChild(nameCell);

    let totalHadir = 0;
    dates.forEach((date) => {
      const td = document.createElement("td");
      let status = null;
      if (attendanceHistory[date] && attendanceHistory[date][siswa]) {
        status = attendanceHistory[date][siswa];
      } else if (date === getTodayString() && attendanceToday[siswa]) {
        status = attendanceToday[siswa];
      }
      if (status === "Hadir") totalHadir++;
      const span = document.createElement("span");
      span.className = `status-badge ${status ? `status-${status.toLowerCase()}` : "status-kosong"}`;
      span.innerText = status || "-";
      td.appendChild(span);
      row.appendChild(td);
    });

    const totalCell = document.createElement("td");
    totalCell.style.fontWeight = "bold";
    totalCell.style.background = "#f0e8df";
    totalCell.innerText = totalHadir;
    row.appendChild(totalCell);
    tbodyRiwayat.appendChild(row);
  });
}

function exportToCSV() {
  let selectedMonth = monthPicker.value;
  if (!selectedMonth) return;
  const [year, month] = selectedMonth.split("-");
  const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const dates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(`${year}-${month}-${String(i).padStart(2, "0")}`);
  }

  let csvRows = [
    ["Nama Siswa", ...dates.map((d) => d.split("-")[2]), "Total Hadir"],
  ];
  sortedStudents.forEach((siswa) => {
    let totalHadir = 0;
    let row = [siswa];
    dates.forEach((date) => {
      let status = null;
      if (attendanceHistory[date] && attendanceHistory[date][siswa]) {
        status = attendanceHistory[date][siswa];
      } else if (date === getTodayString() && attendanceToday[siswa]) {
        status = attendanceToday[siswa];
      }
      if (status === "Hadir") totalHadir++;
      row.push(status || "-");
    });
    row.push(totalHadir);
    csvRows.push(row);
  });

  const csvContent = csvRows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `riwayat_absensi_${selectedMonth}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== RESET ====================
function resetAllAttendance() {
  if (
    confirm("Reset semua absen hari ini? (riwayat sebelumnya tetap tersimpan)")
  ) {
    sortedStudents.forEach((siswa) => {
      attendanceToday[siswa] = null;
    });
    saveToLocalStorage();
    updateStats();
    renderAbsenTable();
    updateDashboard();
    renderRiwayat();
  }
}

// ==================== TAB NAVIGATION ====================
function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`)
    .classList.add("active");
  tabBtns.forEach((btn) => {
    if (btn.getAttribute("data-tab") === tabId) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  currentTab = tabId;
  if (tabId === "dashboard") updateDashboard();
  if (tabId === "riwayat") renderRiwayat();
}

// ==================== INIT ====================
function init() {
  updateDateDisplay();
  checkAndArchivePreviousDay();
  loadFromLocalStorage();
  updateStats();
  renderAbsenTable();
  initFilters();
  resetAllBtn.addEventListener("click", resetAllAttendance);

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () =>
      switchTab(btn.getAttribute("data-tab")),
    );
  });

  monthPicker.addEventListener("change", renderRiwayat);
  exportBtn.addEventListener("click", exportToCSV);
}

function initFilters() {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterValue = btn.getAttribute("data-filter");
      currentFilter = filterValue === "all" ? "all" : filterValue;
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAbsenTable();
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
