'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  Trash2, 
  MoreVertical,
  Check,
  Loader2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/hooks/useProjects'

interface ProjectSelectorProps {
  className?: string
}

export function ProjectSelector({ className }: ProjectSelectorProps) {
  const {
    projects,
    currentProject,
    isLoading,
    fetchProjects,
    createProject,
    selectProject,
    deleteProject,
  } = useProjectStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    const project = await createProject(newProjectName.trim())
    if (project) {
      setNewProjectName('')
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id)
    }
    setMenuOpenId(null)
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
          "bg-[#141419]/90 backdrop-blur-sm border border-white/10",
          "hover:border-white/20 hover:bg-[#1a1a1f]",
          currentProject && "border-primary/30"
        )}
      >
        <FolderOpen className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium truncate max-w-[120px]">
          {currentProject?.name || 'Select Project'}
        </span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 mt-2 w-72 z-50",
              "rounded-xl border border-white/10 shadow-2xl",
              "bg-[#1a1a1f]/95 backdrop-blur-xl overflow-hidden"
            )}
          >
            <div className="p-2 border-b border-white/10">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Projects
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {isCreating && (
                <div className="mt-2 px-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                      placeholder="Project name..."
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm",
                        "bg-[#141419] border border-white/10",
                        "placeholder:text-muted-foreground",
                        "focus:outline-none focus:border-primary/50"
                      )}
                      autoFocus
                    />
                    <button
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim()}
                      className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false)
                        setNewProjectName('')
                      }}
                      className="p-2 rounded-lg hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No projects yet
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-lg",
                      "hover:bg-white/5 transition-colors cursor-pointer",
                      currentProject?.id === project.id && "bg-primary/10"
                    )}
                    onClick={() => {
                      selectProject(project.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className={cn(
                        "w-4 h-4 shrink-0",
                        currentProject?.id === project.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(menuOpenId === project.id ? null : project.id)
                        }}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {menuOpenId === project.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "absolute right-0 top-full mt-1 w-36 z-10",
                              "rounded-lg border border-white/10 shadow-lg",
                              "bg-[#141419] overflow-hidden"
                            )}
                          >
                            <button
                              onClick={(e) => handleDeleteProject(e, project.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
