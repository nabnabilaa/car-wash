export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('pos_token', token);
  } else {
    localStorage.removeItem('pos_token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('pos_token');
};

export const setCurrentUser = (user) => {
  localStorage.setItem('pos_user', JSON.stringify(user));
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('pos_user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};