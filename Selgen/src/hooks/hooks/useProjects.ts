import { create } from 'zustand'
import { Project, CanvasData } from '@/lib/db/schema'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  currentCanvas: CanvasData | null
  isLoading: boolean
  error: string | null
  
  fetchProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project | null>
  selectProject: (id: string) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  saveCanvas: (projectId: string, canvasState: any) => Promise<void>
  clearError: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentCanvas: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects')
      }
      
      set({ projects: data.projects || [], isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false })
    }
  },

  createProject: async (name: string, description?: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }
      
      const newProject = data.project
      set(state => ({
        projects: [newProject, ...state.projects],
        currentProject: newProject,
        isLoading: false,
      }))
      
      return newProject
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false })
      return null
    }
  },

  selectProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/projects/${id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project')
      }
      
      set({
        currentProject: data.project,
        currentCanvas: data.canvasData,
        isLoading: false,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false })
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update project')
      }
      
      set(state => ({
        projects: state.projects.map(p => p.id === id ? result.project : p),
        currentProject: state.currentProject?.id === id ? result.project : state.currentProject,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  deleteProject: async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }
      
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  saveCanvas: async (projectId: string, canvasState: any) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasState }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save canvas')
      }
      
      set({ currentCanvas: data.canvasData })
    } catch (error) {
      console.error('Error saving canvas:', error)
    }
  },

  clearError: () => set({ error: null }),
}))
