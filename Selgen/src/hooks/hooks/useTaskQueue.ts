import { create } from 'zustand'
import { QueueTask, TaskStatus } from '@/components/queue/QueueSidebar'

interface TaskQueueState {
  tasks: QueueTask[]
  isLoading: boolean
  error: string | null
  
  addTask: (task: Omit<QueueTask, 'id' | 'createdAt'>) => string
  updateTask: (id: string, updates: Partial<QueueTask>) => void
  removeTask: (id: string) => void
  clearCompleted: () => void
  clearAll: () => void
  getTasksByStatus: (status: TaskStatus) => QueueTask[]
}

export const useTaskQueue = create<TaskQueueState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  addTask: (task) => {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTask: QueueTask = {
      ...task,
      id,
      createdAt: new Date(),
    }
    
    set(state => ({
      tasks: [...state.tasks, newTask],
    }))
    
    return id
  },

  updateTask: (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      ),
    }))
  },

  removeTask: (id) => {
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
    }))
  },

  clearCompleted: () => {
    set(state => ({
      tasks: state.tasks.filter(
        task => task.status !== 'completed' && task.status !== 'failed'
      ),
    }))
  },

  clearAll: () => {
    set({ tasks: [] })
  },

  getTasksByStatus: (status) => {
    return get().tasks.filter(task => task.status === status)
  },
}))

export function useAgentTask() {
  const { addTask, updateTask, removeTask } = useTaskQueue()

  const submitTask = async (
    name: string,
    description: string,
    executeFn: () => Promise<any>
  ) => {
    const taskId = addTask({
      name,
      description,
      status: 'pending',
      progress: 0,
    })

    try {
      updateTask(taskId, { status: 'processing', progress: 10 })
      
      const result = await executeFn()
      
      updateTask(taskId, {
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        result: result,
        error: result.error,
      })

      return result
    } catch (error) {
      updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Task failed',
      })
      throw error
    }
  }

  return {
    submitTask,
    ...useTaskQueue(),
  }
}
