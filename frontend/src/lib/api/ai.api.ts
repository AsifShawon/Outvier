import api from '../api';

const getSessionKey = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('outvier_session_key') || '';
};

export const aiApi = {
  chat: (question: string) => 
    api.post('/copilot/chat', { question }, {
      headers: {
        'x-session-key': getSessionKey()
      }
    }),
};
