import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface WorkItem {
  id: string;
  type: 'PROJECT' | 'SERVICE';
  title: string;
  description: string;
  status: string;
  amount: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  deadline: string | null;
  timeline: string | null;
  updatedAt: string;
  conversationId: string | null;
  note: string | null;
  noteUpdatedAt: string | null;
  detailsUrl: string;
}

export interface ActiveWorkResponse {
  success: boolean;
  data: {
    items: WorkItem[];
    stats: {
      totalProjects: number;
      totalServices: number;
      totalActive: number;
    };
  };
}

export interface WorkNoteResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    projectId: string | null;
    serviceOrderId: string | null;
    note: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const freelancerWorkApi = {
  /**
   * Get all active work (projects and services)
   */
  getActiveWork: async (type: 'all' | 'projects' | 'services' = 'all'): Promise<ActiveWorkResponse> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/freelancer/active-work?type=${type}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Get note for a work item
   */
  getNote: async (itemType: 'project' | 'service', itemId: string): Promise<WorkNoteResponse> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/work-notes/${itemType}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Create or update note for a work item
   */
  saveNote: async (itemType: 'project' | 'service', itemId: string, note: string): Promise<WorkNoteResponse> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/work-notes/${itemType}/${itemId}`, { note }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Delete note for a work item
   */
  deleteNote: async (itemType: 'project' | 'service', itemId: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/work-notes/${itemType}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};
