import { create } from 'zustand'

interface Partner {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
  lastLogin: string;
}

interface Tender {
  _id: string;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  projectId: string;
  notes: string;
  createdAt: string;
  partners: Partner[];
  document?: Document[];
  category: 'basic' | 'technical' | 'financial' | 'other';
}

interface Document {
  name: string;
  url: string;
  key: string;
  description: string;
  _id: string;
  signedUrl: string;
}

interface CreateTenderData {
  title: string;
  description: string;
  visibility: 'public' | 'private';
  projectId: string;
  notes: string;
  category: 'basic' | 'technical' | 'financial' | 'other';
  documents?: File[];
  documentDescriptions?: string[];
}

interface TenderState {
  tenders: Tender[];
  partners: Partner[];
  isLoading: boolean;
  error: string | null;
  createTender: (data: CreateTenderData) => Promise<void>;
  fetchTenders: (projectId?: string) => Promise<void>;
  fetchPartners: () => Promise<void>;
  selectPartners: (tenderId: string, partnerIds: string[]) => Promise<void>;
  attachDocument: (
    tenderId: string, 
    document: File, 
    documentDescription: string
  ) => Promise<void>;
  deleteTender: (tenderId: string) => Promise<void>;
}

const useTenderStore = create<TenderState>((set, get) => ({
  tenders: [],
  partners: [],
  isLoading: false,
  error: null,
  createTender: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      
      // Get projectId from localStorage or use the one provided
      const projectId = localStorage.getItem('projectId') || data.projectId;
      if (!projectId) {
        throw new Error('Project ID is required. Please select a project.');
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      // Include projectId in the URL path
      const apiUrl = `${baseUrl}/api/tender/create/${projectId}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('visibility', data.visibility);
      formData.append('projectId', projectId);
      formData.append('notes', data.notes);
      formData.append('category', data.category);

      // Add files and their descriptions if present
      if (data.documents && data.documentDescriptions) {
        data.documents.forEach((file, index) => {
          formData.append('document', file);
          formData.append(`documentDescriptions[${index}]`, data.documentDescriptions![index]);
        });
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tender');
      }
      
      // After successful creation, fetch updated tenders using projectId from localStorage
      await useTenderStore.getState().fetchTenders(projectId);
      
    } catch (error) {
      console.error('Create tender error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to create tender. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchTenders: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      
      // Get projectId from localStorage if not provided
      const currentProjectId = projectId || localStorage.getItem('projectId');
      
      // Add validation for projectId
      if (!currentProjectId) {
        throw new Error('Project ID is required. Please select a project.');
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      // Include projectId in the URL path
      const apiUrl = `${baseUrl}/api/tender/${currentProjectId}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tenders');
      }

      const data = await response.json();
      
      // Filter tenders by projectId to ensure only current project's tenders are shown
      const tenders = (data.data || [])
        .filter((tender: Tender) => tender.projectId === currentProjectId);
      
      set({ tenders, error: null });
    } catch (error) {
      console.error('Fetch tenders error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch tenders. Please try again.',
        tenders: [] // Reset tenders on error
      });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchPartners: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/users/all`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch partners');
      }

      const result = await response.json();
      if (result.success) {
        // Filter only users with role 'partner'
        const partners = result.data.filter((user: Partner) => user.role === 'partner');
        set({ partners, error: null });
      }
    } catch (error) {
      console.error('Fetch partners error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch partners. Please try again.'
      });
    } finally {
      set({ isLoading: false });
    }
  },
  selectPartners: async (tenderId: string, partnerIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/tender/select-partners`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenderId,
          partnerIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to select partners');
      }

      // After successful selection, refresh the tenders list using projectId from localStorage
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await get().fetchTenders(projectId);
      }
    } catch (error) {
      console.error('Select partners error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to select partners. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  attachDocument: async (tenderId: string, document: File, documentDescription: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/tender/${tenderId}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const formData = new FormData();
      formData.append('document', document);
      formData.append('documentDescription[0]', documentDescription);

      // Get the tender details from current state
      const tender = get().tenders.find(t => t._id === tenderId);
      if (tender) {
        formData.append('title', tender.title);
        formData.append('description', tender.description);
        formData.append('visibility', tender.visibility);
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to attach document');
      }

      // Refresh tenders after successful upload using projectId from localStorage
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await get().fetchTenders(projectId);
      }
    } catch (error) {
      console.error('Attach document error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to attach document. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  deleteTender: async (tenderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/tender/${tenderId}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete tender');
      }

      // After successful deletion, refresh the tenders list using projectId from localStorage
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await get().fetchTenders(projectId);
      }
    } catch (error) {
      console.error('Delete tender error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to delete tender. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useTenderStore;

export type { Tender, Partner, Document }; 