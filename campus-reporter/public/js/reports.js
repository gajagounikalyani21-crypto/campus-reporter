// Reports Feed, Submission, and Detail Modal Controller

const Reports = {
  currentFilters: {
    status: '',
    category: '',
    building: '',
    priority: '',
    search: '',
    myReports: 'false',
    assignedToMe: 'false',
    sort: 'newest'
  },
  activeReportId: null,

  async init() {
    this.bindEvents();
    await this.loadConfig();
    await this.loadReports();
  },

  async loadConfig() {
    try {
      const config = await API.getConfig();

      // Populate category filters & form dropdowns
      const filterCat = document.getElementById('filter-category');
      const formCat = document.getElementById('report-category');
      if (filterCat) {
        config.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          filterCat.appendChild(opt);
        });
      }
      if (formCat) {
        config.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          formCat.appendChild(opt);
        });
      }

      // Populate building filters & form dropdowns
      const filterBldg = document.getElementById('filter-building');
      const formBldg = document.getElementById('report-building');
      if (filterBldg) {
        config.buildings.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          filterBldg.appendChild(opt);
        });
      }
      if (formBldg) {
        config.buildings.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          formBldg.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Failed to load system config:', err);
    }
  },

  bindEvents() {
    // Search input with debounce
    const searchInput = document.getElementById('report-search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.currentFilters.search = e.target.value.trim();
          this.loadReports();
        }, 300);
      });
    }

    // Filter dropdowns
    ['filter-category', 'filter-building', 'filter-priority', 'filter-status', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          const key = id.replace('filter-', '');
          this.currentFilters[key] = el.value;
          this.loadReports();
        });
      }
    });

    // Pill toggles: All, My Reports, Assigned To Me
    const pillAll = document.getElementById('pill-filter-all');
    const pillMine = document.getElementById('pill-filter-mine');
    const pillAssigned = document.getElementById('pill-filter-assigned');

    if (pillAll) {
      pillAll.addEventListener('click', () => {
        this.setActivePill(pillAll);
        this.currentFilters.myReports = 'false';
        this.currentFilters.assignedToMe = 'false';
        this.loadReports();
      });
    }

    if (pillMine) {
      pillMine.addEventListener('click', () => {
        if (!Auth.isLoggedIn()) {
          Utils.showToast('Please sign in to view your reports.', 'warning');
          return;
        }
        this.setActivePill(pillMine);
        this.currentFilters.myReports = 'true';
        this.currentFilters.assignedToMe = 'false';
        this.loadReports();
      });
    }

    if (pillAssigned) {
      pillAssigned.addEventListener('click', () => {
        if (!Auth.isLoggedIn()) {
          Utils.showToast('Please sign in to view assigned reports.', 'warning');
          return;
        }
        this.setActivePill(pillAssigned);
        this.currentFilters.myReports = 'false';
        this.currentFilters.assignedToMe = 'true';
        this.loadReports();
      });
    }

    // New Report Form Submit
    const reportForm = document.getElementById('new-report-form');
    if (reportForm) {
      reportForm.addEventListener('submit', (e) => this.handleReportSubmit(e));
    }

    // Image file preview
    const fileInput = document.getElementById('report-image-input');
    const previewContainer = document.getElementById('report-image-preview-container');
    const previewImg = document.getElementById('report-image-preview');

    if (fileInput && previewContainer && previewImg) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewContainer.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        } else {
          previewContainer.classList.add('hidden');
        }
      });
    }

    // Comment form inside detail modal
    const commentForm = document.getElementById('modal-comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }

    // Status update form inside detail modal
    const statusForm = document.getElementById('modal-status-form');
    if (statusForm) {
      statusForm.addEventListener('submit', (e) => this.handleStatusUpdate(e));
    }

    // Assign staff form
    const assignBtn = document.getElementById('modal-assign-btn');
    if (assignBtn) {
      assignBtn.addEventListener('click', () => this.handleAssignStaff());
    }
  },

  setActivePill(targetEl) {
    document.querySelectorAll('.filter-pill-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-slate-100', 'text-slate-600', 'hover:bg-slate-200');
    });
    targetEl.classList.add('bg-blue-600', 'text-white');
    targetEl.classList.remove('bg-slate-100', 'text-slate-600');
  },

  async loadReports() {
    const listContainer = document.getElementById('reports-feed-list');
    const emptyState = document.getElementById('reports-empty-state');
    const countBadge = document.getElementById('reports-count-badge');

    if (!listContainer) return;

    listContainer.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-blue-500"></i>
        <p class="text-sm font-medium">Loading live campus issues...</p>
      </div>
    `;

    try {
      const data = await API.getReports(this.currentFilters);
      if (countBadge) countBadge.textContent = `${data.count} issues reported`;

      if (data.reports.length === 0) {
        listContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');
      listContainer.innerHTML = data.reports.map(r => this.renderReportCard(r)).join('');
    } catch (err) {
      listContainer.innerHTML = `
        <div class="col-span-full py-12 text-center text-red-500">
          <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
          <p class="font-medium">${Utils.escapeHtml(err.message)}</p>
        </div>
      `;
    }
  },

  renderReportCard(report) {
    const priorityBadge = Utils.getPriorityBadge(report.priority);
    const statusBadge = Utils.getStatusBadge(report.status);
    const categoryIcon = Utils.getCategoryIcon(report.category);
    const time = Utils.timeAgo(report.createdAt);
    const isUpvoted = report.isUpvotedByMe;

    const imgTag = report.imageUrl ? `
      <div class="h-44 w-full overflow-hidden bg-slate-100 relative group">
        <img src="${report.imageUrl}" alt="${Utils.escapeHtml(report.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.parentElement.style.display='none'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span class="text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm">Click to expand</span>
        </div>
      </div>
    ` : '';

    return `
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden card-hover flex flex-col cursor-pointer" onclick="Reports.openDetailModal('${report.id}')">
        ${imgTag}
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                <i class="fa-solid ${categoryIcon}"></i> ${Utils.escapeHtml(report.category)}
              </span>
              <div class="flex items-center gap-1.5">
                ${priorityBadge}
                ${statusBadge}
              </div>
            </div>

            <h3 class="text-base font-bold text-slate-900 leading-snug mb-2 hover:text-blue-600 transition-colors">
              ${Utils.escapeHtml(report.title)}
            </h3>

            <p class="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
              ${Utils.escapeHtml(report.description)}
            </p>
          </div>

          <div class="pt-3 border-t border-slate-100">
            <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <i class="fa-solid fa-location-dot text-rose-500"></i>
              <span class="truncate font-medium text-slate-700">${Utils.escapeHtml(report.building)}</span>
              ${report.locationDetails ? `• <span class="truncate">${Utils.escapeHtml(report.locationDetails)}</span>` : ''}
            </div>

            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick="event.stopPropagation(); Reports.toggleUpvote('${report.id}')"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    isUpvoted ? 'upvote-active' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }"
                  title="Upvote / I have this issue too"
                >
                  <i class="fa-solid fa-arrow-up ${isUpvoted ? 'text-blue-600' : 'text-slate-400'}"></i>
                  <span>${report.upvotesCount || 0}</span>
                </button>
                <span class="text-slate-400 font-medium">#${report.id.slice(-4)}</span>
              </div>

              <div class="flex items-center gap-2 text-slate-400">
                <span class="text-slate-500 font-medium">${Utils.escapeHtml(report.reporterName)}</span>
                <span>•</span>
                <span>${time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async toggleUpvote(reportId) {
    if (!Auth.isLoggedIn()) {
      Utils.showToast('Please sign in to upvote issues.', 'warning');
      return;
    }
    try {
      const data = await API.toggleUpvote(reportId);
      Utils.showToast(data.message, 'success');
      this.loadReports();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleReportSubmit(e) {
    e.preventDefault();
    if (!Auth.isLoggedIn()) {
      Utils.showToast('Please sign in or select a demo user to report an issue.', 'warning');
      return;
    }

    const form = e.target;
    const submitBtn = document.getElementById('report-submit-btn');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Report';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Submitting...';
    }

    try {
      const formData = new FormData(form);
      const res = await API.createReport(formData);

      Utils.showToast(res.message, 'success');
      form.reset();
      const previewContainer = document.getElementById('report-image-preview-container');
      if (previewContainer) previewContainer.classList.add('hidden');

      // Switch to Feed tab
      App.switchTab('feed');
      this.loadReports();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  },

  async openDetailModal(reportId) {
    this.activeReportId = reportId;
    const modal = document.getElementById('report-detail-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    const contentBox = document.getElementById('modal-report-details');
    if (contentBox) {
      contentBox.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-blue-500"></i>
          <p class="text-sm font-medium">Loading report details...</p>
        </div>
      `;
    }

    try {
      const data = await API.getReportById(reportId);
      this.renderDetailModal(data.report, data.comments);
    } catch (err) {
      if (contentBox) {
        contentBox.innerHTML = `<div class="p-6 text-red-500 font-medium">${Utils.escapeHtml(err.message)}</div>`;
      }
    }
  },

  closeDetailModal() {
    const modal = document.getElementById('report-detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    this.activeReportId = null;
  },

  renderDetailModal(report, comments) {
    const contentBox = document.getElementById('modal-report-details');
    if (!contentBox) return;

    // Steps for lifecycle:
    // 1: Submitted, 2: Under Review, 3: Assigned, 4: In Progress, 5: Resolved
    const steps = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];
    const currentStepIndex = steps.indexOf(report.status);

    const stepsHtml = steps.map((s, idx) => {
      let icon = 'fa-check';
      let stepClass = 'step-pending';
      if (report.status === 'Rejected') {
        stepClass = 'bg-rose-100 text-rose-700';
      } else if (idx < currentStepIndex) {
        stepClass = 'step-complete';
      } else if (idx === currentStepIndex) {
        stepClass = 'step-active';
      }

      return `
        <div class="flex-1 flex flex-col items-center relative text-center">
          <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-sm ${stepClass}">
            ${idx < currentStepIndex ? '<i class="fa-solid fa-check"></i>' : idx + 1}
          </div>
          <span class="text-[11px] font-semibold text-slate-600">${s}</span>
        </div>
      `;
    }).join('');

    const imgSection = report.imageUrl ? `
      <div class="mb-5 rounded-xl overflow-hidden border border-slate-200">
        <img src="${report.imageUrl}" alt="${Utils.escapeHtml(report.title)}" class="w-full max-h-80 object-cover">
      </div>
    ` : '';

    const resolutionBox = report.resolutionNotes ? `
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
        <div class="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
          <i class="fa-solid fa-circle-check text-emerald-600"></i> Resolution Proof & Notes
        </div>
        <p class="text-xs text-emerald-900 leading-relaxed">${Utils.escapeHtml(report.resolutionNotes)}</p>
        ${report.resolvedAt ? `<p class="text-[11px] text-emerald-700 mt-2 font-medium">Completed on: ${Utils.formatDate(report.resolvedAt)}</p>` : ''}
      </div>
    ` : '';

    // Action panel for Staff & Admin
    const canManage = Auth.isStaffOrAdmin();
    const actionPanel = canManage ? `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <i class="fa-solid fa-wrench text-blue-600"></i> Maintenance & Admin Action Panel
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Update Status</label>
            <select id="modal-status-select" class="w-full text-xs rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500">
              ${['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].map(st => `
                <option value="${st}" ${report.status === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Assign Technician</label>
            <div class="flex gap-2">
              <select id="modal-assign-select" class="w-full text-xs rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Choose Staff...</option>
              </select>
              <button onclick="Reports.handleAssignStaff()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">Assign</button>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Resolution Notes (required when resolving)</label>
          <input type="text" id="modal-notes-input" value="${Utils.escapeHtml(report.resolutionNotes || '')}" placeholder="Explain action taken..." class="w-full text-xs rounded-lg border-slate-300 focus:ring-blue-500 mb-2">
          <button onclick="Reports.handleStatusUpdate()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold w-full">
            Save Status & Resolution Update
          </button>
        </div>
      </div>
    ` : '';

    // Comments thread HTML
    const commentsHtml = comments.map(c => `
      <div class="flex items-start gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
          ${c.userName ? c.userName.charAt(0) : 'U'}
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-800">${Utils.escapeHtml(c.userName)}</span>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                c.userRole === 'staff' ? 'bg-amber-100 text-amber-800' : c.userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'
              }">${c.userRole.toUpperCase()}</span>
            </div>
            <span class="text-[11px] text-slate-400">${Utils.timeAgo(c.createdAt)}</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">${Utils.escapeHtml(c.content)}</p>
        </div>
      </div>
    `).join('') || '<p class="text-xs text-slate-400 py-3 text-center">No comments or work notes logged yet.</p>';

    contentBox.innerHTML = `
      <div class="space-y-4">
        <!-- Header Info -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#${report.id}</span>
            <span class="text-xs text-slate-500 font-medium">Reported by <strong>${Utils.escapeHtml(report.reporterName)}</strong></span>
          </div>
          <div class="flex items-center gap-2">
            ${Utils.getPriorityBadge(report.priority)}
            ${Utils.getStatusBadge(report.status)}
          </div>
        </div>

        <h2 class="text-xl font-bold text-slate-900 leading-snug">${Utils.escapeHtml(report.title)}</h2>

        <!-- Lifecycle Progress Bar -->
        <div class="py-3 px-2 bg-slate-50/80 rounded-xl border border-slate-200/60">
          <div class="flex items-center justify-between relative">
            <div class="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>
            ${stepsHtml}
          </div>
        </div>

        <!-- Description -->
        <div class="bg-white rounded-xl">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</h4>
          <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">${Utils.escapeHtml(report.description)}</p>
        </div>

        <!-- Metadata Badges -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl text-xs">
          <div>
            <span class="text-slate-400 block text-[11px]">Building</span>
            <span class="font-bold text-slate-700">${Utils.escapeHtml(report.building)}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Specific Location</span>
            <span class="font-bold text-slate-700">${Utils.escapeHtml(report.locationDetails || 'Not specified')}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Assigned Tech</span>
            <span class="font-bold text-blue-600">${Utils.escapeHtml(report.assignedToName || 'Unassigned')}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Category</span>
            <span class="font-bold text-slate-700">${Utils.escapeHtml(report.category)}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Reported On</span>
            <span class="font-bold text-slate-700">${Utils.formatDate(report.createdAt)}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Community Upvotes</span>
            <span class="font-bold text-emerald-600">${report.upvotesCount || 0} students affected</span>
          </div>
        </div>

        ${imgSection}
        ${resolutionBox}
        ${actionPanel}

        <!-- Discussion Thread -->
        <div class="pt-3 border-t border-slate-200">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i class="fa-solid fa-comments text-blue-500"></i> Work Log & Discussion (${comments.length})
          </h4>

          <div class="space-y-2 mb-4 max-h-60 overflow-y-auto">
            ${commentsHtml}
          </div>

          <!-- Add Comment Form -->
          <div class="flex gap-2">
            <input type="text" id="modal-comment-input" placeholder="${Auth.isLoggedIn() ? 'Add work update or inquiry...' : 'Sign in to comment...'}" class="flex-1 text-xs rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500" ${!Auth.isLoggedIn() ? 'disabled' : ''}>
            <button onclick="Reports.handleCommentSubmit()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold" ${!Auth.isLoggedIn() ? 'disabled' : ''}>
              Send
            </button>
          </div>
        </div>
      </div>
    `;

    // Populate staff dropdown if staff/admin
    if (canManage) {
      this.populateStaffDropdown(report.assignedTo);
    }
  },

  async populateStaffDropdown(currentStaffId) {
    try {
      const data = await API.getStaffList();
      const select = document.getElementById('modal-assign-select');
      if (!select) return;

      select.innerHTML = '<option value="">Choose Staff...</option>';
      data.staff.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.department || s.role})`;
        if (s.id === currentStaffId) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  },

  async handleStatusUpdate() {
    if (!this.activeReportId) return;
    const statusSelect = document.getElementById('modal-status-select');
    const notesInput = document.getElementById('modal-notes-input');

    const status = statusSelect ? statusSelect.value : null;
    const resolutionNotes = notesInput ? notesInput.value.trim() : null;

    if (!status) return;

    try {
      const res = await API.updateStatus(this.activeReportId, { status, resolutionNotes });
      Utils.showToast(res.message, 'success');
      // Refresh modal
      const data = await API.getReportById(this.activeReportId);
      this.renderDetailModal(data.report, data.comments);
      this.loadReports();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleAssignStaff() {
    if (!this.activeReportId) return;
    const select = document.getElementById('modal-assign-select');
    const staffId = select ? select.value : null;

    if (!staffId) {
      Utils.showToast('Please select a staff member.', 'warning');
      return;
    }

    try {
      const res = await API.assignReport(this.activeReportId, staffId);
      Utils.showToast(res.message, 'success');
      const data = await API.getReportById(this.activeReportId);
      this.renderDetailModal(data.report, data.comments);
      this.loadReports();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  async handleCommentSubmit() {
    if (!this.activeReportId) return;
    const input = document.getElementById('modal-comment-input');
    const content = input ? input.value.trim() : '';

    if (!content) return;

    try {
      await API.addComment(this.activeReportId, content);
      input.value = '';
      const data = await API.getReportById(this.activeReportId);
      this.renderDetailModal(data.report, data.comments);
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }
};
