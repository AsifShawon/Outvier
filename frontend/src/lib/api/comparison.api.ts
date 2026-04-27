import api from '../api';
import { v4 as uuidv4 } from 'uuid';

// Helper to get or create anonymous session key
const getSessionKey = () => {
  if (typeof window === 'undefined') return '';
  let key = localStorage.getItem('outvier_session_key');
  if (!key) {
    key = uuidv4();
    localStorage.setItem('outvier_session_key', key);
  }
  return key;
};

// Add headers interceptor specifically for comparison API calls
const getComparisonConfig = () => ({
  headers: {
    'x-session-key': getSessionKey(),
  },
});

export const comparisonApi = {
  getSession: () => api.get('/comparison/session', getComparisonConfig()),
  addProgram: (programId: string) =>
    api.post('/comparison/add-program', { programId }, getComparisonConfig()),
  removeProgram: (programId: string) =>
    api.post('/comparison/remove-program', { programId }, getComparisonConfig()),
  getScores: () => api.get('/comparison/scores', getComparisonConfig()),
};
