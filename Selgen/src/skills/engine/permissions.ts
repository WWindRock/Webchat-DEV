import { PermissionConfig } from './types'

export interface PermissionCheck {
  canExecute: boolean
  canInvoke: boolean
  canAccess: boolean
  canNetwork: boolean
  errors: string[]
}

export class SkillPermissions {
  static async forSkill(skillName: string): Promise<PermissionCheck> {
    // Default permissions - in production, load from config/skills-permissions.yaml
    const defaultPermissions: PermissionConfig = {
      network: true,
      filesystem: { read: true, write: false },
      skills: { invoke: [] },
      resources: []
    }

    return {
      canExecute: true,
      canInvoke: true,
      canAccess: true,
      canNetwork: defaultPermissions.network ?? false,
      errors: []
    }
  }

  static checkPermission(
    required: PermissionConfig,
    granted: PermissionConfig
  ): { allowed: boolean; violations: string[] } {
    const violations: string[] = []

    // Check network permission
    if (required.network && !granted.network) {
      violations.push('Network access not granted')
    }

    // Check filesystem permissions
    const requiredFs = required.filesystem
    const grantedFs = granted.filesystem
    
    if (requiredFs) {
      if (requiredFs.read && !(grantedFs?.read ?? false)) {
        violations.push('Filesystem read permission not granted')
      }
      if (requiredFs.write && !(grantedFs?.write ?? false)) {
        violations.push('Filesystem write permission not granted')
      }
    }

    // Check skill invocation permissions
    const requiredSkills = required.skills?.invoke || []
    const grantedSkills = granted.skills?.invoke || []
    
    for (const skill of requiredSkills) {
      if (!grantedSkills.includes(skill)) {
        violations.push(`Cannot invoke skill: ${skill}`)
      }
    }

    // Check resource access
    const requiredResources = required.resources || []
    const grantedResources = granted.resources || []
    
    for (const resource of requiredResources) {
      const hasAccess = grantedResources.some(granted => 
        this.matchResourcePattern(resource, granted)
      )
      if (!hasAccess) {
        violations.push(`Cannot access resource: ${resource}`)
      }
    }

    return {
      allowed: violations.length === 0,
      violations
    }
  }

  private static matchResourcePattern(resource: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<DOUBLESTAR>>>/g, '.*')
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(resource)
  }
}
