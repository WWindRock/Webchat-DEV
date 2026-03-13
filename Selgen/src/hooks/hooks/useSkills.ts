import { useState, useCallback, useEffect } from 'react'
import type { SkillInfo, SkillResult, SkillMetadata } from '@/skills/engine'

interface UseSkillsOptions {
  autoFetch?: boolean
}

interface UseSkillsReturn {
  skills: SkillInfo[]
  isLoading: boolean
  error: Error | null
  executeSkill: (skillName: string, params: Record<string, any>) => Promise<SkillResult>
  getSkillMetadata: (skillName: string) => Promise<SkillMetadata | null>
  refreshSkills: () => Promise<void>
}

export function useSkills(options: UseSkillsOptions = {}): UseSkillsReturn {
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchSkills = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/skills')
      if (!response.ok) {
        throw new Error(`Failed to fetch skills: ${response.status}`)
      }

      const data = await response.json()
      setSkills(data.skills || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch skills'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const executeSkill = useCallback(async (
    skillName: string,
    params: Record<string, any>
  ): Promise<SkillResult> => {
    const response = await fetch('/api/skills/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName, params })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to execute skill: ${skillName}`)
    }

    return response.json()
  }, [])

  const getSkillMetadata = useCallback(async (skillName: string): Promise<SkillMetadata | null> => {
    try {
      const response = await fetch(`/api/skills/${skillName}/metadata`)
      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }, [])

  const refreshSkills = useCallback(async () => {
    await fetchSkills()
  }, [fetchSkills])

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchSkills()
    }
  }, [fetchSkills, options.autoFetch])

  return {
    skills,
    isLoading,
    error,
    executeSkill,
    getSkillMetadata,
    refreshSkills
  }
}
