import { create } from 'zustand'

interface FilePathItem {
  url: string;
  key: string;
  description: string;
  _id: string;
}

interface Document {
  _id: string;
  title: string;
  projectId: string;
  notes: string;
  filePath: FilePathItem[];
  uploadedBy: string;
  createdAt: string;
  category: 'legal' | 'technical' | 'financial' | 'basic' | 'other';
  __v: number;
}

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocuments: (data: FormData) => Promise<void>;
  fetchDocuments: (projectId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,

  uploadDocuments: async (data: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get projectId from localStorage
      const projectId = localStorage.getItem('projectId');
      if (!projectId) {
        throw new Error('Project ID is required. Please select a project.');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      // Include projectId in the URL path
      const response = await fetch(`${baseUrl}/api/document/upload/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to upload documents');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // After successful upload, refetch documents using projectId from localStorage
        await get().fetchDocuments(projectId);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to upload documents', isLoading: false });
    }
  },

  fetchDocuments: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Get projectId from localStorage if not provided
      const currentProjectId = projectId || localStorage.getItem('projectId');
      
      // Add validation for projectId
      if (!currentProjectId) {
        throw new Error('Project ID is required. Please select a project.');
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${baseUrl}/api/document/${currentProjectId}?page=1&limit=200`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch documents' }));
        throw new Error(errorData.message || 'Failed to fetch documents');
      }

      const result = await response.json();
      console.log('Documents API Response:', result);
      
      if (result.success && Array.isArray(result.data)) {
        // Filter documents by projectId to ensure only current project's documents are shown
        const documents = result.data.filter((doc: Document) => doc.projectId === currentProjectId);
        console.log('Filtered documents:', documents);
        console.log('Total documents after filtering:', documents.length);
        set({ documents, isLoading: false });
      } else {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch documents', 
        isLoading: false,
        documents: [] // Reset documents on error
      });
    }
  },

  deleteDocument: async (documentId: string) => {
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

      const response = await fetch(`${baseUrl}/api/document/delete/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete document' }));
        throw new Error(errorData.message || 'Failed to delete document');
      }

      // Refresh documents after successful deletion
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await get().fetchDocuments(projectId);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete document', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useDocumentStore; 