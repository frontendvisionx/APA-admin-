import { create } from 'zustand'

interface User {
  email: string;
  // Add other user fields as needed
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, phone: string) => Promise<string>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: localStorage.getItem('isLoggedIn') === 'true',
  isLoading: false,
  error: null,
  token: localStorage.getItem('token'),
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Set localStorage items first
      localStorage.setItem('token', data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('projectId', data.projectId);
      
      // Then update the state
      set({ 
        isAuthenticated: true, 
        token: data.token,
        error: null,
        user: data.user
      });

      // Add a small delay before reloading to ensure localStorage is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload the page after successful login
      window.location.reload();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Login failed',
        isAuthenticated: false,
        token: null,
        user: null
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    // Clear all items from localStorage
    localStorage.clear();
    
    // Reset auth state
    set({ 
      isAuthenticated: false, 
      token: null,
      error: null,
      user: null
    });

    // Force reload the page to clear any cached state
    window.location.href = '/login';
  },
  register: async (name: string, email: string, password: string, phone: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: 'developer'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register user');
      }

      const result = await response.json();
      return result.message;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
}));

export default useAuthStore;
