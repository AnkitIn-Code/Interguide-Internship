import { API_BASE_URL } from '../utils/apiBaseUrl';

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  updateProfile: async (profileData) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  updateSkills: async (skills) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ technicalSkills: skills, softSkills: [] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `Failed to update skills: ${response.status}`);
    }

    return response.json();
  },

  markOnboarded: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return { onboarded: true }; // silent no-op if not logged in
    const response = await fetch(`${API_BASE_URL}/user/onboarded`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return { onboarded: true }; // non-critical, don't throw
    return response.json();
  },
};

// ─── Skills API — points to real /api/skills endpoints ───────────────────────
export const skillsAPI = {
  get: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/skills`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return { skills: [] };
    return response.json();
  },

  save: async ({ techSkills, softSkills } = {}) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Backend route reads req.body.technicalSkills and req.body.softSkills
      body: JSON.stringify({ technicalSkills: techSkills || [], softSkills: softSkills || [] }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to save skills');
    }
    return response.json();
  },

  merge: async ({ techSkills, softSkills } = {}) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ technicalSkills: techSkills || [], softSkills: softSkills || [] }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to merge skills');
    }
    return response.json();
  },
};

// ─── Current User API ─────────────────────────────────────────────────────────
export const currentUserAPI = {
  me: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  markOnboarded: async () => {
    return userAPI.markOnboarded();
  },
};

// ─── Internship API ───────────────────────────────────────────────────────────
export const internshipAPI = {
  getLatestInternships: async (filters = {}, refresh = false) => {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    if (filters?.skills) {
      const skills = Array.isArray(filters.skills) ? filters.skills.join(',') : String(filters.skills || '');
      if (skills) params.set('skills', skills);
    }
    if (filters?.location) params.set('location', String(filters.location));
    if (filters?.domain) params.set('domain', String(filters.domain));
    params.set('limit', '50');
    if (refresh) params.set('refresh', 'true');

    const url = `${API_BASE_URL}/internships/latest?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  refreshInternships: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/internships/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  getRecommendations: async (filters = {}) => {
    const token = localStorage.getItem('authToken');
    let sector = '';
    let location = '';
    let tech = '';

    try {
      if (Array.isArray(filters)) {
        tech = filters.filter(Boolean).join(', ');
      } else if (filters && typeof filters === 'object') {
        sector = typeof filters.sector === 'string' ? filters.sector : '';
        if (!sector && Array.isArray(filters.sectors) && filters.sectors.length) {
          sector = String(filters.sectors[0] ?? '');
        }
        location = typeof filters.location === 'string' ? filters.location : '';
        if (!location && Array.isArray(filters.locations) && filters.locations.length) {
          location = String(filters.locations[0] ?? '');
        }
        tech = typeof filters.tech === 'string' ? filters.tech : '';
        if (!tech && Array.isArray(filters.skills)) {
          tech = filters.skills.filter(Boolean).join(', ');
        }
      }
    } catch {}

    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    return response.json();
  },

  getAllInternships: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/internships`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  getDiscoverInternships: async ({ page = 1, limit = 9, search = '', skills = [] } = {}) => {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (skills.length > 0) params.set('skills', skills.join(','));
    const response = await fetch(`${API_BASE_URL}/internships/discover?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },
};

// ─── Applications API ─────────────────────────────────────────────────────────
export const applicationsAPI = {
  list: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to load applications');
    }
    return response.json(); // returns { applications: [...] }
  },

  create: async (internshipId) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ internshipId }),
    });
    return response.json();
  },

  recentActivity: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications/recent-activity`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  upcomingDeadlines: async () => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications/upcoming-deadlines`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  // upsert: create or update an application by internshipId
  upsert: async (payload) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to save application');
    }
    return response.json();
  },

  // update: update application status — uses correct /status suffix
  update: async (id, updates) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to update application');
    }
    return response.json();
  },

  delete: async (id) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to remove application');
    }
    return response.json();
  },
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsAPI = {
  // Store API key locally only — don't send to backend
  saveAIApiKey: (apiKey) => {
    localStorage.setItem('aiApiKey', apiKey);
    return Promise.resolve({ success: true });
  },

  getAIApiKey: () => {
    return localStorage.getItem('aiApiKey') || import.meta.env?.VITE_AI_API_KEY || null;
  },
};

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: async (message, context = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('You must be logged in to chat.');

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const reason = errorBody?.message || 'Unable to reach AI assistant.';
      throw new Error(reason);
    }

    return response.json();
  },
};

// ─── Resume API ───────────────────────────────────────────────────────────────
export const resumeAPI = {
  analyze: async (file) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/resume/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to analyze resume');
    }

    return response.json();
  },

  upload: async (file) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to upload resume');
    }

    return response.json();
  },

  getMyResume: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${API_BASE_URL}/resume/my-resume`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  delete: async (resumeId) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');
    const response = await fetch(`${API_BASE_URL}/resume/${resumeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  improve: async (text, role = 'Internship candidate') => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/resume/improve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to improve resume');
    }

    return response.json();
  },

  // Two-step ATS analysis: optionally pass a file (PDF/DOCX) and/or jobDescription
  atsAnalyze: async ({ file = null, resumeText = '', jobDescription = '', useStoredResume = true } = {}) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Authentication required');

    const formData = new FormData();
    if (file) formData.append('resume', file);
    if (resumeText) formData.append('resumeText', resumeText);
    if (jobDescription) formData.append('jobDescription', jobDescription);
    formData.append('useStoredResume', String(useStoredResume));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    try {
      const response = await fetch(`${API_BASE_URL}/resume/ats-analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'ATS analysis failed');
      }

      return response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Analysis timed out. The AI is taking longer than expected. Please try again.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

// ─── Scraper API ──────────────────────────────────────────────────────────────
export const scraperAPI = {
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scraper/stats`);
      return response.json();
    } catch (error) {
      console.error('Failed to fetch scraper stats:', error);
      return { success: false, data: {} };
    }
  },

  getStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scraper/status`);
      return response.json();
    } catch (error) {
      console.error('Failed to fetch scraper status:', error);
      return { success: false, data: {} };
    }
  },

  trigger: async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/scraper/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (error) {
      console.error('Failed to trigger scraper:', error);
      return { success: false };
    }
  },

  stop: async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_BASE_URL}/scraper/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (error) {
      console.error('Failed to stop scraper:', error);
      return { success: false };
    }
  },

  getScrapedInternships: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters?.sources) {
        params.set('sources', Array.isArray(filters.sources) ? filters.sources.join(',') : filters.sources);
      }
      if (filters?.limit) params.set('limit', filters.limit);
      if (filters?.page) params.set('page', filters.page);

      const url = `${API_BASE_URL}/internships${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      console.error('Failed to fetch scraped internships:', error);
      return { success: false, data: [] };
    }
  },
};
