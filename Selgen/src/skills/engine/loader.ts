import { RegisteredSkill } from './types'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as yaml from 'yaml'

const SUPPORTING_FILES = ['reference.md', 'examples.md', 'template.md', 'README.md']

export class SkillLoader {
  private skillsDir: string
  private registeredSkills: Map<string, RegisteredSkill> = new Map()

  constructor(skillsDir: string = 'skills') {
    this.skillsDir = skillsDir
  }

  async loadAllSkills(): Promise<RegisteredSkill[]> {
    const skills: RegisteredSkill[] = []
    
    try {
      const entries = await fs.readdir(this.skillsDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(this.skillsDir, entry.name)
          const skill = await this.loadSkill(skillPath)
          if (skill) {
            skills.push(skill)
            this.registeredSkills.set(skill.name, skill)
          }
        }
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    }
    
    return skills
  }

  async loadSkill(skillPath: string): Promise<RegisteredSkill | null> {
    try {
      const skillDirName = path.basename(skillPath)
      const skillMdPath = path.join(skillPath, 'SKILL.md')
      
      let content: string
      try {
        content = await fs.readFile(skillMdPath, 'utf-8')
      } catch {
        console.warn(`SKILL.md not found in: ${skillPath}`)
        return null
      }
      
      // Parse YAML frontmatter (Claude Code 标准)
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!match) {
        console.warn(`Invalid SKILL.md format in: ${skillPath}. Using entire content as documentation.`)
        // 尝试解析整个文件为 YAML（如果没有 frontmatter 分隔符）
        const metadata = this.tryParseYaml(content)
        if (!metadata?.name) {
          // 使用目录名作为默认名称
          metadata.name = skillDirName
        }
        return this.buildSkill(skillPath, metadata, content)
      }

      const frontmatter = match[1]
      const documentation = match[2].trim()
      
      let metadata: any
      try {
        metadata = yaml.parse(frontmatter)
      } catch (e) {
        console.warn(`Failed to parse YAML frontmatter in: ${skillPath}`)
        metadata = {}
      }

      // 设置默认值
      if (!metadata.name) {
        metadata.name = skillDirName
      }
      if (!metadata.description && documentation) {
        // 使用文档第一段作为描述
        const firstPara = documentation.split('\n\n')[0]
        metadata.description = firstPara.substring(0, 200)
      }

      // 加载支持文件
      const supportingFiles = await this.loadSupportingFiles(skillPath)

      return this.buildSkill(skillPath, metadata, documentation, supportingFiles)
    } catch (error) {
      console.error(`Error loading skill from ${skillPath}:`, error)
      return null
    }
  }

  private tryParseYaml(content: string): any {
    try {
      return yaml.parse(content)
    } catch {
      return null
    }
  }

  private async loadSupportingFiles(skillPath: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {}
    
    for (const fileName of SUPPORTING_FILES) {
      const filePath = path.join(skillPath, fileName)
      try {
        const stat = await fs.stat(filePath)
        if (stat.isFile()) {
          files[fileName] = await fs.readFile(filePath, 'utf-8')
        }
      } catch {
        // 文件不存在，跳过
      }
    }
    
    return files
  }

  private buildSkill(
    skillPath: string, 
    metadata: any, 
    documentation: string,
    supportingFiles?: Record<string, string>
  ): RegisteredSkill {
    const skill: RegisteredSkill = {
      name: metadata.name,
      display_name: metadata.display_name || metadata.name,
      description: metadata.description || '',
      version: metadata.version || '1.0.0',
      path: skillPath,
      metadata,
      manifest: this.generateManifest(metadata),
      permissions: metadata.permissions || { network: true },
      isActive: true,
      lastLoaded: new Date(),
      
      // Claude Code 标准字段
      argument_hint: metadata.argument_hint,
      disable_model_invocation: metadata.disable_model_invocation,
      user_invocable: metadata.user_invocable !== false,
      allowed_tools: metadata.allowed_tools,
      model: metadata.model,
      context: metadata.context || 'default',
      agent: metadata.agent,
      hooks: metadata.hooks,
      
      // 文档内容
      documentation,
      
      // 支持文件
      supportingFiles
    }

    return skill
  }

  private generateManifest(metadata: any): any {
    if (!metadata.parameters) {
      return {
        type: 'function',
        function: {
          name: metadata.name,
          description: metadata.description || '',
          parameters: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      }
    }

    return {
      type: 'function',
      function: {
        name: metadata.name,
        description: metadata.description || '',
        parameters: {
          type: 'object',
          properties: metadata.parameters,
          required: Object.entries(metadata.parameters)
            .filter(([_, def]: [string, any]) => def.required)
            .map(([name]) => name)
        }
      }
    }
  }

  getSkill(name: string): RegisteredSkill | undefined {
    return this.registeredSkills.get(name)
  }

  listSkills(): RegisteredSkill[] {
    return Array.from(this.registeredSkills.values())
  }

  // 查找可以被模型自动调用的技能
  findAutoInvocable(): RegisteredSkill[] {
    return Array.from(this.registeredSkills.values())
      .filter(skill => !skill.disable_model_invocation)
  }

  // 查找用户可调用的技能
  findUserInvocable(): RegisteredSkill[] {
    return Array.from(this.registeredSkills.values())
      .filter(skill => skill.user_invocable !== false)
  }

  // 通过触发词查找
  findByTrigger(trigger: string): RegisteredSkill | undefined {
    for (const skill of Array.from(this.registeredSkills.values())) {
      const commands = skill.metadata.triggers?.commands || []
      if (commands.includes(trigger)) {
        return skill
      }
    }
    return undefined
  }

  // 解析技能参数（支持 $ARGUMENTS, $N 等）
  parseArguments(content: string, rawArgs: string): string {
    let parsed = content
    
    // 替换 $ARGUMENTS
    parsed = parsed.replace(/\$ARGUMENTS/g, rawArgs)
    
    // 替换 $ARGUMENTS[N]
    parsed = parsed.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, index) => {
      const args = rawArgs.split(' ')
      return args[parseInt(index)] || ''
    })
    
    // 替换 $N (简写形式)
    parsed = parsed.replace(/\$(\d+)/g, (_, index) => {
      const args = rawArgs.split(' ')
      return args[parseInt(index)] || ''
    })
    
    return parsed
  }
}

export const skillLoader = new SkillLoader()
