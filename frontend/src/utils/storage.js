// localStorage 관련 유틸리티 함수들
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },
};

// 사용자 관련 저장소
export const userStorage = {
  getUserId: () => storage.get('userId'),
  setUserId: (userId) => storage.set('userId', userId),
  removeUserId: () => storage.remove('userId'),
  
  getRole: () => storage.get('currentRole'),
  setRole: (role) => storage.set('currentRole', role),
  removeRole: () => storage.remove('currentRole'),
  
  getConcern: () => storage.get('currentConcern'),
  setConcern: (concern) => storage.set('currentConcern', concern),
  removeConcern: () => storage.remove('currentConcern'),
};
