// Lost & Found Section Controller

const LostFound = {
  currentFilter: 'all',

  init() {
    this.bindEvents();
    this.loadItems();
  },

  bindEvents() {
    // Filter pills
    ['lf-filter-all', 'lf-filter-lost', 'lf-filter-found'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          document.querySelectorAll('.lf-filter-btn').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-slate-100', 'text-slate-600');
          });
          el.classList.add('bg-blue-600', 'text-white');
          el.classList.remove('bg-slate-100', 'text-slate-600');

          this.currentFilter = id.replace('lf-filter-', '');
          this.loadItems();
        });
      }
    });

    // Post modal open/close
    const openBtn = document.getElementById('open-post-lf-modal');
    const closeBtn = document.getElementById('close-post-lf-modal');
    const modal = document.getElementById('post-lf-modal');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        if (!Auth.isLoggedIn()) {
          Utils.showToast('Please sign in or select a demo user to post.', 'warning');
          return;
        }
        modal.classList.remove('hidden');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Submit form
    const form = document.getElementById('post-lf-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const formData = new FormData(form);
          const res = await API.createLostFound(formData);
          Utils.showToast(res.message, 'success');
          form.reset();
          if (modal) modal.classList.add('hidden');
          this.loadItems();
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      });
    }
  },

  async loadItems() {
    const container = document.getElementById('lostfound-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-blue-500"></i>
        <p class="text-xs font-medium">Loading lost & found notices...</p>
      </div>
    `;

    try {
      const params = {};
      if (this.currentFilter !== 'all') {
        params.type = this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1);
      }

      const data = await API.getLostFound(params);
      if (data.items.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <i class="fa-solid fa-box-open text-3xl mb-2 text-slate-300"></i>
            <p class="text-sm font-semibold text-slate-600">No notices posted in this category</p>
          </div>
        `;
        return;
      }

      container.innerHTML = data.items.map(item => this.renderCard(item)).join('');
    } catch (err) {
      container.innerHTML = `<div class="col-span-full text-center text-red-500 text-sm py-8">${Utils.escapeHtml(err.message)}</div>`;
    }
  },

  renderCard(item) {
    const isLost = item.type === 'Lost';
    const typeBadge = isLost
      ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200"><i class="fa-solid fa-magnifying-glass mr-1"></i> Lost</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-hand-holding-hand mr-1"></i> Found</span>';

    const statusBadge = item.status === 'Claimed'
      ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Claimed / Returned</span>'
      : '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Active</span>';

    const canClaim = Auth.isLoggedIn() && (Auth.getUser().id === item.reportedBy || Auth.isStaffOrAdmin());

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between card-hover">
        <div class="p-5">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-1.5">
              ${typeBadge}
              ${statusBadge}
            </div>
            <span class="text-xs text-slate-400 font-medium">${Utils.timeAgo(item.createdAt)}</span>
          </div>

          <h3 class="text-base font-bold text-slate-900 leading-snug mb-2">${Utils.escapeHtml(item.title)}</h3>
          <p class="text-xs text-slate-600 leading-relaxed mb-4">${Utils.escapeHtml(item.description)}</p>

          <div class="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-location-dot text-rose-500 w-4 text-center"></i>
              <span class="truncate">Location: <strong class="text-slate-700">${Utils.escapeHtml(item.location)}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-address-book text-blue-500 w-4 text-center"></i>
              <span class="truncate">Contact: <strong class="text-slate-700">${Utils.escapeHtml(item.contactInfo)}</strong></span>
            </div>
          </div>
        </div>

        ${canClaim ? `
          <div class="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button onclick="LostFound.handleToggleClaim('${item.id}')" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white transition-colors">
              ${item.status === 'Active' ? 'Mark as Claimed / Resolved' : 'Reactivate Notice'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  async handleToggleClaim(id) {
    try {
      const res = await API.claimLostFound(id);
      Utils.showToast(res.message, 'success');
      this.loadItems();
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  }
};
