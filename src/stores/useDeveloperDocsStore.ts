import { create } from 'zustand'

interface FilePath {
  url: string;
  key: string;
  description: string;
  _id: string;
}

interface UploadedBy {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DeveloperDocument {
  _id: string;
  title: string;
  description: string;
  filePath: FilePath[];
  category: string;
  projectId: string;
  notes: string;
  uploadedBy: UploadedBy;
  status: string;
  isApproved: boolean;
  createdAt: string;
}

interface DeveloperDocsResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  data: DeveloperDocument[];
}

interface DeveloperDocsStore {
  documents: DeveloperDocument[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  fetchDocuments: (projectId: string) => Promise<void>;
}

const useDeveloperDocsStore = create<DeveloperDocsStore>((set) => ({
  documents: [],
  isLoading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,

  fetchDocuments: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(
        `${baseUrl}/api/document/${projectId}?uploadedByRole=developer`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch documents');
      }

      const result: DeveloperDocsResponse = await response.json();
      
      if (result.success) {
        set({
          documents: result.data,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch documents',
        isLoading: false 
      });
    }
  },
}));

export default useDeveloperDocsStore; 