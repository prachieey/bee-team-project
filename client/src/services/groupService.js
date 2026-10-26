// src/services/groupService.js
import api from './api';

// Groups
export const getGroups   = ()           => api.get('/groups');
export const createGroup = (data)       => api.post('/groups', data);
export const getGroup    = (id)         => api.get(`/groups/${id}`);
export const updateGroup = (id, data)   => api.put(`/groups/${id}`, data);
export const deleteGroup = (id)         => api.delete(`/groups/${id}`);

// Group Expenses
export const getGroupExpenses   = (groupId)            => api.get(`/groups/${groupId}/expenses`);
export const createGroupExpense = (groupId, data)      => api.post(`/groups/${groupId}/expenses`, data);
export const updateGroupExpense = (groupId, expId, data) => api.put(`/groups/${groupId}/expenses/${expId}`, data);
export const deleteGroupExpense = (groupId, expId)     => api.delete(`/groups/${groupId}/expenses/${expId}`);

// Settlement
export const getSettlement      = (groupId) => api.get(`/groups/${groupId}/settlement`);
export const getGroupSettlement = (groupId) => api.get(`/groups/${groupId}/settlement`);
// New: record payment settlement
export const markPayment = (groupId, payload) => api.post(`/groups/${groupId}/settlement/pay`, payload);

