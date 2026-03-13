import { RegisteredSkill } from './engine/types'

class SkillRegistry {
  private skills: Map<string, RegisteredSkill> = new Map()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    // Load skills from skills/ directory
    const { skillLoader } = await import('./engine/loader')
    const skills = await skillLoader.loadAllSkills()
    
    for (const skill of skills) {
      this.skills.set(skill.name, skill)
    }
    
    this.initialized = true
    console.log(`Loaded ${skills.length} skills`)
  }

  register(skill: RegisteredSkill): void {
    this.skills.set(skill.name, skill)
  }

  unregister(skillName: string): boolean {
    return this.skills.delete(skillName)
  }

  get(skillName: string): RegisteredSkill | undefined {
    return this.skills.get(skillName)
  }

  list(): RegisteredSkill[] {
    return Array.from(this.skills.values())
  }

  search(query: string): RegisteredSkill[] {
    const lowerQuery = query.toLowerCase()
    return this.list().filter(skill =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery) ||
      (skill.metadata.tags || []).some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    )
  }

  findByCommand(command: string): RegisteredSkill | undefined {
    return this.list().find(skill =>
      (skill.metadata.triggers?.commands || []).includes(command)
    )
  }
}

export const skillRegistry = new SkillRegistry()
