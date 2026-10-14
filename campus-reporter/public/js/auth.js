// Authentication & Session State Management

const Auth = {
  currentUser: null,

  init() {
    const savedUser = localStorage.getItem('cr_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (_) {
        this.currentUser = null;
      }
    }
    this.updateUI();

    window.addEventListener('auth:expired', () => {
      this.currentUser = null;
      this.updateUI();
      Utils.showToast('Your session has expired. Please sign in again.', 'warning');
    });
  },

  getUser() {
    return this.currentUser;
  },

  isLoggedIn() {
    return !!this.currentUser && !!API.getToken();
  },

  getRole() {
    return this.currentUser ? this.currentUser.role : 'guest';
  },

  isStaffOrAdmin() {
    const r = this.getRole();
    return r === 'staff' || r === 'admin';
  },

  isAdmin() {
    return this.getRole() === 'admin';
  },

  setSession(user, token) {
    this.currentUser = user;
    localStorage.setItem('cr_user', JSON.stringify(user));
    API.setToken(token);
    this.updateUI();
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user } }));
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('cr_user');
    API.setToken(null);
    this.updateUI();
    Utils.showToast('You have been signed out.', 'info');
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
  },

  async switchDemo(role) {
    try {
      const data = await API.demoLogin(role);
      this.setSession(data.user, data.token);
      Utils.showToast(`Switched account: ${data.user.name} (${role.toUpperCase()})`, 'success');
    } catch (err) {
      Utils.showToast(err.message, 'error');
    }
  },

  updateUI() {
    const userDisplay = document.getElementById('navbar-user-display');
    const guestDisplay = document.getElementById('navbar-guest-display');
    const adminTabBtn = document.getElementById('nav-admin-tab');
    const staffFilterPill = document.getElementById('filter-assigned-pill');

    if (this.isLoggedIn()) {
      if (userDisplay) userDisplay.classList.remove('hidden');
      if (guestDisplay) guestDisplay.classList.add('hidden');

      const nameEl = document.getElementById('user-display-name');
      const roleEl = document.getElementById('user-display-role');
      const avatarEl = document.getElementById('user-display-avatar');

      if (nameEl) nameEl.textContent = this.currentUser.name;
      if (roleEl) roleEl.textContent = this.currentUser.role.toUpperCase();
      if (avatarEl) avatarEl.src = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}`;

      // Show/Hide role specific tabs
      if (adminTabBtn) {
        if (this.isStaffOrAdmin()) {
          adminTabBtn.classList.remove('hidden');
        } else {
          adminTabBtn.classList.add('hidden');
        }
      }

      if (staffFilterPill) {
        if (this.isStaffOrAdmin()) {
          staffFilterPill.classList.remove('hidden');
        } else {
          staffFilterPill.classList.add('hidden');
        }
      }
    } else {
      if (userDisplay) userDisplay.classList.add('hidden');
      if (guestDisplay) guestDisplay.classList.remove('hidden');
      if (adminTabBtn) adminTabBtn.classList.add('hidden');
      if (staffFilterPill) staffFilterPill.classList.add('hidden');
    }
  }
};
