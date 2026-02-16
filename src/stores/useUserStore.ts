import { create } from 'zustand'

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  projects?: Project[];
}

interface UserResponse {
  success: boolean;
  results: number;
  total: number;
  totalPages: number;
  currentPage: number;
  data: User[];
}

interface UserStore {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  fetchUsers: (page: number) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const useUserStore = create<UserStore>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,

  fetchUsers: async (page: number) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);

      if (!token) {
        throw new Error('Authentication token not found');
      } 

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      console.log('Base URL:', baseUrl);

      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      // Get projectId from localStorage to filter users on the backend
      const projectId = localStorage.getItem('projectId');
      
      // Build URL with projectIds parameter if projectId exists
      let url = `${baseUrl}/api/users/all?page=${page}&limit=10`;
      if (projectId) {
        url += `&projectIds=${projectId}`;
      }
      
      console.log('Fetching users from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch users');
      }

      const result: UserResponse = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        // Backend now handles filtering, so use the data directly
        set({
          users: result.data,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch users', isLoading: false });
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      console.log('Delete URL:', `${baseUrl}/api/auth/delete/${userId}`);

      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${baseUrl}/api/auth/delete/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete user' }));
        console.error('Delete error response:', errorData);
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Remove the deleted user from the state
      set((state) => ({
        users: state.users.filter(user => user._id !== userId),
      }));

      // Refetch users to ensure the list is up to date
      const currentPage = useUserStore.getState().currentPage;
      await useUserStore.getState().fetchUsers(currentPage);
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  },
}));

export default useUserStore; 