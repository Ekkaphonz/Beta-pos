// ── js/auth.js ── Authentication Logic

const AUTH = {
  users: {
    cashier: { username: 'cashier', password: 'pos1234', role: 'user' },
    staff: { username: 'staff', password: 'staff123', role: 'user' }
  },
  admins: {
    admin: { username: 'admin', password: 'admin2024', role: 'admin' }
  },

  loginUser(username, password) {
    const user = this.users[username];
    if (user && user.password === password) {
      sessionStorage.setItem('pos_user', JSON.stringify({ username, role: 'user', loginTime: Date.now() }));
      return true;
    }
    return false;
  },

  loginAdmin(username, password) {
    const admin = this.admins[username];
    if (admin && admin.password === password) {
      sessionStorage.setItem('pos_admin', JSON.stringify({ username, role: 'admin', loginTime: Date.now() }));
      return true;
    }
    return false;
  },

  logoutUser() {
    sessionStorage.removeItem('pos_user');
    window.location.href = 'login.html';
  },

  logoutAdmin() {
    sessionStorage.removeItem('pos_admin');
    window.location.href = 'admin-login.html';
  },

  isUserLoggedIn() {
    const data = sessionStorage.getItem('pos_user');
    return data ? JSON.parse(data) : null;
  },

  isAdminLoggedIn() {
    const data = sessionStorage.getItem('pos_admin');
    return data ? JSON.parse(data) : null;
  },

  requireUser() {
    if (!this.isUserLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdminLoggedIn()) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  }
};