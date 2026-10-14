// Main Application Orchestrator

const App = {
  currentTab: 'feed',

  init() {
    Auth.init();
    Reports.init();
    LostFound.init();
    Admin.init();

    this.bindGlobalEvents();
    this.loadAnnouncements();

    // Re-render when auth changes
    window.addEventListener('auth:change', () => {
      Reports.loadReports();
      Admin.loadDashboard();
      LostFound.loadItems();
    });
  },

  bindGlobalEvents() {
    // Nav tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Emergency SOS Modal
    const sosBtn = document.getElementById('sos-emergency-btn');
    const sosModal = document.getElementById('sos-modal');
    const closeSos = document.getElementById('close-sos-modal');

    if (sosBtn && sosModal) {
      sosBtn.addEventListener('click', () => sosModal.classList.remove('hidden'));
    }
    if (closeSos && sosModal) {
      closeSos.addEventListener('click', () => sosModal.classList.add('hidden'));
    }

    // Auth Modal
    const authModal = document.getElementById('auth-modal');
    const openLoginBtn = document.getElementById('open-login-btn');
    const closeAuthBtn = document.getElementById('close-auth-modal');
    const authTabLogin = document.getElementById('auth-tab-login');
    const authTabRegister = document.getElementById('auth-tab-register');
    const loginFormContainer = document.getElementById('auth-login-container');
    const registerFormContainer = document.getElementById('auth-register-container');

    if (openLoginBtn && authModal) {
      openLoginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    }
    if (closeAuthBtn && authModal) {
      closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));
    }

    if (authTabLogin && authTabRegister) {
      authTabLogin.addEventListener('click', () => {
        authTabLogin.classList.add('border-blue-600', 'text-blue-600');
        authTabLogin.classList.remove('border-transparent', 'text-slate-500');
        authTabRegister.classList.remove('border-blue-600', 'text-blue-600');
        authTabRegister.classList.add('border-transparent', 'text-slate-500');
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
      });

      authTabRegister.addEventListener('click', () => {
        authTabRegister.classList.add('border-blue-600', 'text-blue-600');
        authTabRegister.classList.remove('border-transparent', 'text-slate-500');
        authTabLogin.classList.remove('border-blue-600', 'text-blue-600');
        authTabLogin.classList.add('border-transparent', 'text-slate-500');
        registerFormContainer.classList.remove('hidden');
        loginFormContainer.classList.add('hidden');
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
          const res = await API.login({ email, password });
          Auth.setSession(res.user, res.token);
          Utils.showToast(`Welcome back, ${res.user.name}!`, 'success');
          authModal.classList.add('hidden');
          loginForm.reset();
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      });
    }

    // Register Form Submit
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const department = document.getElementById('reg-dept').value;

        try {
          const res = await API.register({ name, email, password, role, department });
          Auth.setSession(res.user, res.token);
          Utils.showToast('Account created successfully!', 'success');
          authModal.classList.add('hidden');
          regForm.reset();
        } catch (err) {
          Utils.showToast(err.message, 'error');
        }
      });
    }

    // User Logout
    const logoutBtn = document.getElementById('user-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    // Detail modal close
    const closeDetailModalBtn = document.getElementById('close-report-modal');
    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener('click', () => Reports.closeDetailModal());
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active nav styling
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabId) {
        btn.classList.add('border-blue-600', 'text-blue-600');
        btn.classList.remove('border-transparent', 'text-slate-600');
      } else {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent', 'text-slate-600');
      }
    });

    // Toggle tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Auto-refresh when entering admin or lostfound
    if (tabId === 'admin') {
      Admin.loadDashboard();
    } else if (tabId === 'lostfound') {
      LostFound.loadItems();
    } else if (tabId === 'feed') {
      Reports.loadReports();
    }
  },

  async loadAnnouncements() {
    const banner = document.getElementById('announcements-banner');
    const container = document.getElementById('announcements-list');

    if (!banner || !container) return;

    try {
      const data = await API.getAnnouncements();
      if (data.announcements.length === 0) {
        banner.classList.add('hidden');
        return;
      }

      banner.classList.remove('hidden');
      container.innerHTML = data.announcements.map(ann => `
        <div class="flex items-start gap-2.5 p-3 rounded-xl border ${
          ann.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-blue-50 border-blue-200 text-blue-900'
        }">
          <i class="fa-solid ${ann.priority === 'Urgent' ? 'fa-triangle-exclamation text-rose-600' : 'fa-bullhorn text-blue-600'} text-sm mt-0.5 shrink-0"></i>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h5 class="text-xs font-bold truncate">${Utils.escapeHtml(ann.title)}</h5>
              <span class="text-[10px] opacity-70 shrink-0">${Utils.timeAgo(ann.createdAt)}</span>
            </div>
            <p class="text-xs opacity-90 mt-0.5 leading-relaxed">${Utils.escapeHtml(ann.content)}</p>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
