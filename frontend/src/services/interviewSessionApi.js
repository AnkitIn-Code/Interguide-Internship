import axios from '../utils/axios';

export const generateQuestions = async (data) => {
    return await axios.post('/interview-sessions/generate-questions', data);
};

export const createInterviewSession = async (data) => {
    return await axios.post('/interview-sessions/create', data);
};

export const getSessionByToken = async (token) => {
    return await axios.get(`/interview-sessions/token/${token}`);
};

export const completeSession = async (token, report) => {
    return await axios.post(`/interview-sessions/token/${token}/complete`, { report });
};

export const getSessionReport = async (applicationId) => {
    return await axios.get(`/interview-sessions/application/${applicationId}`);
};

export const updateJobQuestions = async (jobId, questions) => {
    return await axios.patch(`/jobs/${jobId}/questions`, { aiInterviewQuestions: questions });
};
