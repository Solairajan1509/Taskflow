import api from './api';

export const uploadFile = async (file, projectId, taskId) => {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) formData.append('projectId', projectId);
  if (taskId) formData.append('taskId', taskId);
  const { data } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getProjectFiles = async (projectId) => {
  const { data } = await api.get(`/files/project/${projectId}`);
  return data;
};

export const getTaskFiles = async (taskId) => {
  const { data } = await api.get(`/files/task/${taskId}`);
  return data;
};

export const deleteFile = async (fileId) => {
  const { data } = await api.delete(`/files/${fileId}`);
  return data;
};

export const renameFile = async (fileId, name) => {
  const { data } = await api.patch(`/files/${fileId}/rename`, { name });
  return data;
};
