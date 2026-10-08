import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useComplaints = () => {
  return useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data } = await api.get('/complaints');
      return data;
    }
  });
};

export const useWorkerTasks = () => {
  return useQuery({
    queryKey: ['workerTasks'],
    queryFn: async () => {
      const { data } = await api.get('/workers/tasks');
      return data;
    }
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    }
  });
};
