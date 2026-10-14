// Dean & Campus Administrator Analytics Controller

const Admin = {
  charts: {},

  async init() {
    this.bindEvents();
    if (Auth.isStaffOrAdmin()) {
      await this.loadDashboard();
    }
  },

  bindEvents() {
    const exportBtn = document.getElementById('admin-export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          Utils.showToast('Generating campus facility audit CSV report...', 'info');
          await API.downloadCsv();
          Utils.showToast('CSV report downloaded successfully!', 'success');
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      });
    }

    const refreshBtn = document.getElementById('admin-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadDashboard();
        Utils.showToast('Analytics refreshed', 'info');
      });
    }

    // New Broadcast Notice Form
    const noticeForm = document.getElementById('admin-notice-form');
    if (noticeForm) {
      noticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('notice-title').value.trim();
        const content = document.getElementById('notice-content').value.trim();
        const priority = document.getElementById('notice-priority').value;
        const pinned = document.getElementById('notice-pinned').checked;

        try {
          await API.createAnnouncement({ title, content, priority, pinned });
          Utils.showToast('Campus alert broadcasted successfully!', 'success');
          noticeForm.reset();
          App.loadAnnouncements();
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      });
    }
  },

  async loadDashboard() {
    try {
      const data = await API.getStats();
      const stats = data.stats;

      // Update KPI Cards
      this.updateElement('stat-total-reports', stats.totalReports);
      this.updateElement('stat-open-reports', stats.openReports);
      this.updateElement('stat-resolved-reports', stats.resolvedReports);
      this.updateElement('stat-critical-reports', stats.criticalUnresolved);
      this.updateElement('stat-resolution-rate', `${stats.resolutionRate}%`);
      this.updateElement('stat-avg-hours', `${stats.avgResolutionHours}h`);

      // Render Charts
      this.renderCharts(stats);

      // Render Recent Activity Timeline
      this.renderActivityTimeline(stats.recentActivities);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      Utils.showToast('Failed to load analytics: ' + err.message, 'error');
    }
  },

  updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  renderCharts(stats) {
    // 1. Category Donut Chart
    const catCanvas = document.getElementById('chart-categories');
    if (catCanvas && window.Chart) {
      if (this.charts.cat) this.charts.cat.destroy();

      const labels = Object.keys(stats.categoryCounts);
      const data = Object.values(stats.categoryCounts);

      this.charts.cat = new Chart(catCanvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              '#f59e0b', '#3b82f6', '#6366f1', '#10b981',
              '#14b8a6', '#f43f5e', '#f97316', '#84cc16', '#64748b'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
          }
        }
      });
    }

    // 2. Building Distribution Horizontal Bar Chart
    const bldgCanvas = document.getElementById('chart-buildings');
    if (bldgCanvas && window.Chart) {
      if (this.charts.bldg) this.charts.bldg.destroy();

      const labels = Object.keys(stats.buildingCounts).map(b => b.replace('Academic Block ', 'Block '));
      const data = Object.values(stats.buildingCounts);

      this.charts.bldg = new Chart(bldgCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Incident Count',
            data,
            backgroundColor: '#3b82f6',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { precision: 0 } },
            y: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // 3. Status Breakdown Bar Chart
    const statusCanvas = document.getElementById('chart-statuses');
    if (statusCanvas && window.Chart) {
      if (this.charts.status) this.charts.status.destroy();

      const labels = Object.keys(stats.statusCounts);
      const data = Object.values(stats.statusCounts);

      this.charts.status = new Chart(statusCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Tickets',
            data,
            backgroundColor: ['#94a3b8', '#a855f7', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
    }
  },

  renderActivityTimeline(activities = []) {
    const container = document.getElementById('admin-activity-timeline');
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">No recent campus events logged.</p>';
      return;
    }

    container.innerHTML = activities.map(act => `
      <div class="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
        <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          <i class="fa-solid fa-clock-rotate-left text-[11px] text-blue-500"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800 truncate">${Utils.escapeHtml(act.action)}</span>
            <span class="text-[11px] text-slate-400 shrink-0">${Utils.timeAgo(act.createdAt)}</span>
          </div>
          <p class="text-xs text-slate-600 truncate mt-0.5">${Utils.escapeHtml(act.details)}</p>
          <span class="text-[10px] text-slate-400">By ${Utils.escapeHtml(act.userName)}</span>
        </div>
      </div>
    `).join('');
  }
};
