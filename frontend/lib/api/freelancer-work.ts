import { api } from '../api';

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
    const response = await api.get(`/freelancer/active-work?type=${type}`);
    return response.data;
  },

  /**
   * Get note for a work item
   */
  getNote: async (itemType: 'project' | 'service', itemId: string): Promise<WorkNoteResponse> => {
    const response = await api.get(`/work-notes/${itemType}/${itemId}`);
    return response.data;
  },

  /**
   * Create or update note for a work item
   */
  saveNote: async (itemType: 'project' | 'service', itemId: string, note: string): Promise<WorkNoteResponse> => {
    const response = await api.post(`/work-notes/${itemType}/${itemId}`, { note });
    return response.data;
  },

  /**
   * Delete note for a work item
   */
  deleteNote: async (itemType: 'project' | 'service', itemId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/work-notes/${itemType}/${itemId}`);
    return response.data;
  }
};
