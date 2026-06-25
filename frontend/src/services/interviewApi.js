import api from '../utils/axios'; // Points to frontend/src/utils/axios.js
export const startInterview = async (formData) => {
    const response = await api.post('/interview/start', formData);
    return response.data;
};
export const evaluateAnswer = async (formData) => {
    const response = await api.post('/interview/evaluate', formData, {
        timeout: 60000,
    });
    return response.data;
};
export const generateReport = async (answers, job_role) => {
    const response = await api.post('/interview/report', { answers, job_role });
    return response.data;
};
export const transcribeAudio = async (formData) => {
    const response = await api.post('/interview/transcribe', formData, {
        timeout: 60000,
    });
    return response.data;
};
// In-memory TTS cache: key = "text|voice" → blob URL
const _ttsCache = new Map();

export const speakText = async (text, voice = 'en-US-AriaNeural') => {
    const cacheKey = `${text}|${voice}`;
    if (_ttsCache.has(cacheKey)) {
        const cachedBlob = _ttsCache.get(cacheKey);
        _ttsCache.delete(cacheKey); // one-time use
        return URL.createObjectURL(cachedBlob);
    }
    const response = await api.post('/interview/speak', { text, voice }, {
        responseType: 'blob',
        timeout: 30000,
    });
    return URL.createObjectURL(response.data);
};

// Pre-fetch TTS audio and store in cache (fire-and-forget)
export const prefetchTts = async (text, voice = 'en-US-ChristopherNeural') => {
    const cacheKey = `${text}|${voice}`;
    if (_ttsCache.has(cacheKey)) return;
    try {
        const response = await api.post('/interview/speak', { text, voice }, {
            responseType: 'blob',
            timeout: 30000,
        });
        _ttsCache.set(cacheKey, response.data);
    } catch (err) {
        // Silent fail — QuestionBox will fetch normally as fallback
        console.warn('TTS prefetch failed:', err.message);
    }
};
