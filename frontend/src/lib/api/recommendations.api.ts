import api from '../api';

export const recommendationsApi = {
  /** Get personalised recommendations for the logged-in student */
  getMyRecommendations: () => api.get('/recommendations/me'),

  /** Preview recommendations for an arbitrary profile (no auth required) */
  getRecommendationsForProfile: (profile: Record<string, unknown>) =>
    api.post('/recommendations/profile', profile),
};
