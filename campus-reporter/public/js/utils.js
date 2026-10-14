// Utility functions for Campus Reporter frontend

const Utils = {
  // Safe HTML escape to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Relative time format
  timeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatDate(isoString) {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Category Icon mapping
  getCategoryIcon(category) {
    const map = {
      'Electrical & Power': 'fa-bolt text-amber-500',
      'Plumbing & Water': 'fa-faucet-drip text-blue-500',
      'IT, Wi-Fi & Labs': 'fa-wifi text-indigo-500',
      'Classroom & Furniture': 'fa-chalkboard-user text-emerald-500',
      'Sanitation & Hygiene': 'fa-pump-soap text-teal-500',
      'Campus Security & Safety': 'fa-shield-halved text-rose-500',
      'Hostel & Mess': 'fa-bed text-orange-500',
      'Sports & Grounds': 'fa-volleyball text-green-500',
      'Other Facility': 'fa-screwdriver-wrench text-slate-500'
    };
    return map[category] || 'fa-triangle-exclamation text-slate-500';
  },

  // Priority Badge HTML
  getPriorityBadge(priority) {
    switch (priority) {
      case 'Emergency/Critical':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-emergency pulse-critical">
          <i class="fa-solid fa-triangle-exclamation text-red-600"></i> Critical
        </span>`;
      case 'High':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-high">
          <i class="fa-solid fa-angles-up text-orange-600"></i> High
        </span>`;
      case 'Medium':
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-medium">
          <i class="fa-solid fa-angle-up text-amber-600"></i> Medium
        </span>`;
      case 'Low':
      default:
        return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold badge-low">
          <i class="fa-solid fa-angle-down text-slate-500"></i> Low
        </span>`;
    }
  },

  // Status Badge HTML
  getStatusBadge(status) {
    const map = {
      'Submitted': 'status-submitted',
      'Under Review': 'status-under-review',
      'Assigned': 'status-assigned',
      'In Progress': 'status-in-progress',
      'Resolved': 'status-resolved',
      'Rejected': 'status-rejected'
    };
    const iconMap = {
      'Submitted': 'fa-paper-plane',
      'Under Review': 'fa-magnifying-glass',
      'Assigned': 'fa-user-gear',
      'In Progress': 'fa-spinner fa-spin',
      'Resolved': 'fa-circle-check',
      'Rejected': 'fa-ban'
    };
    const cls = map[status] || 'status-submitted';
    const icon = iconMap[status] || 'fa-circle-dot';
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">
      <i class="fa-solid ${icon}"></i> ${status}
    </span>`;
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const typeConfigs = {
      success: { bg: 'bg-emerald-600', icon: 'fa-circle-check' },
      error: { bg: 'bg-rose-600', icon: 'fa-circle-xmark' },
      warning: { bg: 'bg-amber-600', icon: 'fa-triangle-exclamation' },
      info: { bg: 'bg-blue-600', icon: 'fa-circle-info' }
    };
    const cfg = typeConfigs[type] || typeConfigs.info;

    toast.className = `flex items-center gap-3 px-4 py-3 text-white rounded-xl shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 ${cfg.bg}`;
    toast.innerHTML = `
      <i class="fa-solid ${cfg.icon} text-lg"></i>
      <span class="text-sm font-medium">${this.escapeHtml(message)}</span>
      <button class="ml-auto text-white/80 hover:text-white" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
