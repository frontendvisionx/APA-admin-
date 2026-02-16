import { create } from 'zustand'

type AnnouncementType = 'information' | 'alert' | 'success' | 'warning' | 'error';
type AnnouncementCategory = 'AGM/SGM' | 'Prebid Meeting' | 'Corrigendum/Additions' | 'Comparision Of Bids' | 'Presentations of Developers' | 'Other';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  projectId: string;
  announcementType: AnnouncementType;
  category: AnnouncementCategory;
  createdAt: string;
  isPinned?: boolean;
  isScheduled?: boolean;
  scheduledDate?: string;
  documents?: string[];
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  projectId: string;
  announcementType: AnnouncementType;
  category: AnnouncementCategory;
  isPinned?: boolean;
  isScheduled?: boolean;
  scheduledDate?: string;
  createdAt: string;
  documents?: File[];
  documentDescriptions?: string[];
}

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  createAnnouncement: (data: CreateAnnouncementData) => Promise<void>;
  fetchAnnouncements: (projectId: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Omit<Announcement, '_id' | 'createdAt'>>) => Promise<void>;
}

const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: [],
  isLoading: false,
  error: null,
  createAnnouncement: async (data: CreateAnnouncementData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      
      // Get projectId from localStorage or use the one provided
      const projectId = localStorage.getItem('projectId') || data.projectId;
      if (!projectId) {
        throw new Error('Project ID is required. Please select a project.');
      }
      
      // Include projectId in the URL path
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/announcement/create/${projectId}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('description', data.content);
      formData.append('projectId', projectId);
      formData.append('announcementType', data.announcementType);
      formData.append('category', data.category);
      formData.append('createdAt', data.createdAt);
      
      // Add isPinned if provided
      if (data.isPinned) {
        formData.append('isPinned', String(data.isPinned));
      }
      
      // Add scheduling data if provided
      if (data.isScheduled) {
        formData.append('isScheduled', String(data.isScheduled));
        if (data.scheduledDate) {
          formData.append('scheduledDate', data.scheduledDate);
        }
      }
      
      // Handle file uploads if present
      if (data.documents) {
        data.documents.forEach((doc, index) => {
          formData.append('document', doc);
          if (data.documentDescriptions?.[index]) {
            formData.append('documentDescriptions', data.documentDescriptions[index]);
          }
        });
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create announcement');
      }
      
      // After successful creation, fetch updated announcements using projectId from localStorage
      await useAnnouncementStore.getState().fetchAnnouncements(projectId);
      
    } catch (error) {
      console.error('Create announcement error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to create announcement. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchAnnouncements: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      
      // Get projectId from localStorage if not provided
      const currentProjectId = projectId || localStorage.getItem('projectId');
      
      // Add validation for projectId
      if (!currentProjectId) {
        throw new Error('Project ID is required. Please select a project.');
      }
      
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/announcement/${currentProjectId}`;
      
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
        throw new Error(errorData.message || 'Failed to fetch announcements');
      }

      const data = await response.json();
      
      // Filter announcements by projectId to ensure only current project's announcements are shown
      const announcements = (data.data || [])
        .filter((announcement: Announcement) => announcement.projectId === currentProjectId)
        .map((announcement: Announcement) => ({
          ...announcement,
          isPinned: announcement.isPinned || false,
        }));

      set({ announcements, error: null });
    } catch (error) {
      console.error('Fetch announcements error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch announcements. Please try again.',
        announcements: [] // Reset announcements on error
      });
    } finally {
      set({ isLoading: false });
    }
  },
  deleteAnnouncement: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/announcement/${id}`;
      
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
        throw new Error(errorData.message || 'Failed to delete announcement');
      }

      // Remove the deleted announcement from the state
      set((state) => ({
        announcements: state.announcements.filter(announcement => announcement._id !== id),
        isLoading: false,
      }));

      // Refetch announcements for the current project after deletion
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await useAnnouncementStore.getState().fetchAnnouncements(projectId);
      }
    } catch (error) {
      console.error('Delete announcement error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to delete announcement. Please try again.',
        isLoading: false,
      });
      throw error;
    }
  },
  updateAnnouncement: async (id: string, data: Partial<Omit<Announcement, '_id' | 'createdAt'>>) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = `${baseUrl}/api/announcement/${id}`;
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      // Helper function to check if an item is a File object
      const isFile = (item: any): item is File => {
        return item && typeof item === 'object' && item instanceof File;
      };
      
      // Check if we have files to upload
      const hasFiles = data.documents !== undefined && 
        Array.isArray(data.documents) && 
        data.documents.length > 0 && 
        isFile(data.documents[0]);
      
      let requestBody: any;
      
      if (hasFiles) {
        // Create FormData for file uploads
        const formData = new FormData();
        
        // Add basic data
        if (data.title) formData.append('title', data.title);
        if (data.content) {
          formData.append('content', data.content);
          formData.append('description', data.content); // Send both for API compatibility
        }
        if (data.projectId) formData.append('projectId', data.projectId);
        if (data.announcementType) formData.append('announcementType', data.announcementType);
        if (data.category) formData.append('category', data.category);
        
        // Add isPinned if present
        if (data.isPinned !== undefined) {
          formData.append('isPinned', String(data.isPinned));
        }
        
        // Add scheduling data if present
        if (data.isScheduled !== undefined) {
          formData.append('isScheduled', String(data.isScheduled));
          if (data.scheduledDate) {
            formData.append('scheduledDate', data.scheduledDate);
          }
        }
        
        // Add documents and descriptions
        if (data.documents) {
          const docs = data.documents as unknown as File[];
          const descriptions = (data as any).documentDescriptions || [];
          
          docs.forEach((doc, index) => {
            formData.append('document', doc);
            if (descriptions[index]) {
              formData.append('documentDescriptions', descriptions[index]);
            }
          });
        }
        
        requestBody = formData;
      } else {
        // Use JSON for regular updates without files
        requestBody = JSON.stringify({
          ...data,
          // Map content to description for API compatibility
          ...(data.content && { description: data.content }),
        });
        
        // Add Content-Type header for JSON requests
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update announcement');
      }

      const updatedAnnouncement = await response.json();

      // Refetch announcements for the current project after update
      const projectId = localStorage.getItem('projectId');
      if (projectId) {
        await useAnnouncementStore.getState().fetchAnnouncements(projectId);
      } else {
        // Fallback: update the announcement in the state
        set((state) => ({
          announcements: state.announcements.map(announcement => 
            announcement._id === id ? { ...announcement, ...updatedAnnouncement.data } : announcement
          ),
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Update announcement error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to update announcement. Please try again.',
        isLoading: false,
      });
      throw error;
    }
  },
}));

export default useAnnouncementStore; 