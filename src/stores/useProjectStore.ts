import { create } from 'zustand'

interface Project {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  status: string;
  reraNo: string;
  endDate: string;
}

interface ProjectState {
  project: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
}

const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  projects: [],
  isLoading: false,
  error: null,
  
  // Fetch all projects
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/project`;
      
      console.log('Fetching projects with:', {
        apiUrl,
        hasToken: !!token,
        tokenPreview: token ? `${token.slice(0, 10)}...` : null
      });
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Add additional headers for ngrok
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // If using ngrok, add the bypass header
      if (apiUrl.includes('ngrok')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        
        // Special handling for ngrok responses
        if (text.includes('ngrok')) {
          throw new Error('Ngrok endpoint requires confirmation. Please visit the API URL directly in a browser first to confirm the endpoint.');
        }
        
        throw new Error('Server error: Expected JSON response but got HTML. Please check the API endpoint.');
      }

      const data = await response.json();
      console.log('Projects data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch projects');
      }

      if (data.success && Array.isArray(data.data)) {
        const projects = data.data;
        set({ projects, error: null });
        
        // If no project is selected, select the first one or from localStorage
        const currentProjectId = localStorage.getItem('projectId');
        if (currentProjectId) {
          const project = projects.find((p: Project) => p._id === currentProjectId);
          if (project) {
            set({ project });
          } else if (projects.length > 0) {
            // If stored project ID doesn't exist, select first project
            localStorage.setItem('projectId', projects[0]._id);
            set({ project: projects[0] });
          }
        } else if (projects.length > 0) {
          localStorage.setItem('projectId', projects[0]._id);
          set({ project: projects[0] });
        }
      } else {
        throw new Error('No projects found');
      }
    } catch (error) {
      console.error('Projects fetch error:', error);
      set({ 
        error: error instanceof Error 
          ? error.message 
          : 'Network error or server is not responding. Please try again.'
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch single project (backward compatibility)
  fetchProject: async () => {
    await get().fetchProjects();
  },

  // Select a project by ID
  selectProject: async (projectId: string) => {
    const { projects } = get();
    const selectedProject = projects.find((p: Project) => p._id === projectId);
    
    if (selectedProject) {
      localStorage.setItem('projectId', projectId);
      set({ project: selectedProject });
      
      // Dispatch custom event to notify components of project change
      window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId } }));
      
      // Reload the page to refresh all data with new project
      window.location.reload();
    } else {
      throw new Error('Project not found');
    }
  },
}));

export default useProjectStore; 