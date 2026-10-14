// API client wrapper for Campus Reporter

const API = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('cr_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('cr_token', token);
    } else {
      localStorage.removeItem('cr_token');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/demo-login')) {
        // Token expired or invalid
        this.setToken(null);
        localStorage.removeItem('cr_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      if (options.responseType === 'blob') {
        if (!response.ok) throw new Error('File download failed');
        return await response.blob();
      }

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.message || (data.errors ? data.errors.join(', ') : 'Request failed');
        throw new Error(errorMsg);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  demoLogin(role) {
    return this.request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  getStaffList() {
    return this.request('/auth/staff');
  },

  // Metadata
  getConfig() {
    return this.request('/config');
  },

  // Reports
  getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports${query ? '?' + query : ''}`);
  },

  getReportById(id) {
    return this.request(`/reports/${id}`);
  },

  createReport(formData) {
    return this.request('/reports', {
      method: 'POST',
      body: formData
    });
  },

  updateStatus(id, updateData) {
    return this.request(`/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  assignReport(id, staffId) {
    return this.request(`/reports/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ staffId })
    });
  },

  toggleUpvote(id) {
    return this.request(`/reports/${id}/upvote`, {
      method: 'POST'
    });
  },

  deleteReport(id) {
    return this.request(`/reports/${id}`, {
      method: 'DELETE'
    });
  },

  // Comments
  addComment(reportId, content) {
    return this.request(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  // Lost & Found
  getLostFound(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/lost-found${query ? '?' + query : ''}`);
  },

  createLostFound(formData) {
    return this.request('/lost-found', {
      method: 'POST',
      body: formData
    });
  },

  claimLostFound(id) {
    return this.request(`/lost-found/${id}/claim`, {
      method: 'PUT'
    });
  },

  // Announcements
  getAnnouncements() {
    return this.request('/announcements');
  },

  createAnnouncement(data) {
    return this.request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Analytics
  getStats() {
    return this.request('/stats');
  },

  async downloadCsv() {
    const blob = await this.request('/stats/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus_facility_audit_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }
};
