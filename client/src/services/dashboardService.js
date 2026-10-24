// src/services/dashboardService.js
import api from './api';

export const getDashboardSummary = () => api.get('/dashboard/summary');
