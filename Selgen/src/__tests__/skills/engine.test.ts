import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SkillExecutor } from '@/skills/engine/executor';
import { SkillLoader } from '@/skills/engine/loader';
import { SkillPermissions } from '@/skills/engine/permissions';
import type { SkillParameters, SkillContext } from '@/skills/engine/types';

describe('Skill Engine', () => {
  describe('SkillExecutor', () => {
    let executor: SkillExecutor;

    beforeEach(() => {
      executor = new SkillExecutor();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a skill executor instance', () => {
      expect(executor).toBeDefined();
      expect(executor).toBeInstanceOf(SkillExecutor);
    });

    it('should validate parameters', async () => {
      const result = await executor.execute({
        skillName: 'test-skill',
        params: null as unknown as SkillParameters,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parameters must be an object');
    });

    it('should handle execution timeout', async () => {
      vi.spyOn(executor as any, 'loadSkillModule').mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ default: () => ({ type: 'text', content: 'result' }) }), 1000);
        });
      });

      const result = await executor.execute({
        skillName: 'test-skill',
        params: {},
        userId: 'user-123',
        timeout: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should cancel execution', async () => {
      const executionId = 'test-skill_user-123_1234567890';
      
      // Create a mock execution
      const controller = new AbortController();
      (executor as any).executions.set(executionId, controller);

      const cancelled = executor.cancelExecution(executionId);
      
      expect(cancelled).toBe(true);
    });

    it('should return false when cancelling non-existent execution', () => {
      const cancelled = executor.cancelExecution('non-existent-id');
      expect(cancelled).toBe(false);
    });

    it('should create valid execution context', async () => {
      const context = await (executor as any).createContext(
        'user-123',
        { canInvoke: true, canAccess: true, canNetwork: true },
        undefined
      );

      expect(context).toBeDefined();
      expect(context.user.id).toBe('user-123');
      expect(context.conversation).toBeDefined();
      expect(context.resources).toBeDefined();
      expect(context.memory).toBeDefined();
      expect(context.skills).toBeDefined();
      expect(context.storage).toBeDefined();
      expect(context.permissions).toBeDefined();
      expect(context.logger).toBeDefined();
      expect(context.reportProgress).toBeDefined();
    });
  });

  describe('SkillLoader', () => {
    let loader: SkillLoader;

    beforeEach(() => {
      loader = new SkillLoader('./skills');
    });

    it('should create a skill loader instance', () => {
      expect(loader).toBeDefined();
      expect(loader).toBeInstanceOf(SkillLoader);
    });

    it('should set default skills directory', () => {
      const defaultLoader = new SkillLoader();
      expect(defaultLoader).toBeDefined();
    });

    it('should return empty array when loading skills from invalid directory', async () => {
      const loader = new SkillLoader('/non-existent-directory');
      const skills = await loader.loadAllSkills();
      expect(skills).toEqual([]);
    });

    it('should get registered skill by name', () => {
      const skill = {
        name: 'test-skill',
        displayName: 'Test Skill',
        description: 'A test skill',
        version: '1.0.0',
        path: '/skills/test-skill',
        metadata: {
          name: 'test-skill',
          displayName: 'Test Skill',
          description: 'A test skill',
          version: '1.0.0',
          author: 'test',
          tags: [],
          categories: [],
          triggers: { commands: [], keywords: [], autoActivate: false },
          parameters: {},
          permissions: { network: true, filesystem: ['read'], skills: [], resources: [] },
          execution: { timeout: 60000, maxMemory: '512MB', type: 'sync', retryPolicy: { maxAttempts: 3, backoff: 'exponential' } },
          resources: [],
          relatedSkills: [],
        },
        manifest: {},
        permissions: { network: true, filesystem: ['read'], skills: [], resources: [] },
        isActive: true,
        lastLoaded: new Date(),
      };

      (loader as any).registeredSkills.set('test-skill', skill);

      const result = loader.getSkill('test-skill');
      expect(result).toBeDefined();
      expect(result?.name).toBe('test-skill');
    });

    it('should return undefined for unregistered skill', () => {
      const result = loader.getSkill('non-existent');
      expect(result).toBeUndefined();
    });

    it('should list all registered skills', () => {
      const skills = loader.listSkills();
      expect(Array.isArray(skills)).toBe(true);
    });

    it('should find skill by trigger', () => {
      const skill = {
        name: 'test-skill',
        displayName: 'Test Skill',
        description: 'A test skill',
        version: '1.0.0',
        path: '/skills/test-skill',
        metadata: {
          name: 'test-skill',
          displayName: 'Test Skill',
          description: 'A test skill',
          version: '1.0.0',
          author: 'test',
          tags: [],
          categories: [],
          triggers: { commands: ['/test'], keywords: [], autoActivate: false },
          parameters: {},
          permissions: { network: true, filesystem: ['read'], skills: [], resources: [] },
          execution: { timeout: 60000, maxMemory: '512MB', type: 'sync', retryPolicy: { maxAttempts: 3, backoff: 'exponential' } },
          resources: [],
          relatedSkills: [],
        },
        manifest: {},
        permissions: { network: true, filesystem: ['read'], skills: [], resources: [] },
        isActive: true,
        lastLoaded: new Date(),
      };

      (loader as any).registeredSkills.set('test-skill', skill);

      const result = loader.findByTrigger('/test');
      expect(result).toBeDefined();
      expect(result?.name).toBe('test-skill');
    });

    it('should return undefined when trigger not found', () => {
      const result = loader.findByTrigger('/unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('SkillPermissions', () => {
    it('should return default permissions for skill', async () => {
      const permissions = await SkillPermissions.forSkill('test-skill');

      expect(permissions.canExecute).toBe(true);
      expect(permissions.canInvoke).toBe(true);
      expect(permissions.canAccess).toBe(true);
      expect(permissions.canNetwork).toBe(true);
      expect(permissions.errors).toEqual([]);
    });

    it('should check permissions correctly', () => {
      const required = {
        network: true,
        filesystem: ['read', 'write'] as ('read' | 'write')[],
        skills: ['skill-a'],
        resources: ['resource-a'],
      };

      const granted = {
        network: true,
        filesystem: ['read', 'write'] as ('read' | 'write')[],
        skills: ['skill-a', 'skill-b'],
        resources: ['resource-a', 'resource-b'],
      };

      const result = SkillPermissions.checkPermission(required, granted);
      
      expect(result.allowed).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should detect missing network permission', () => {
      const required = { network: true, filesystem: [] as ('read' | 'write')[], skills: [], resources: [] };
      const granted = { network: false, filesystem: [] as ('read' | 'write')[], skills: [], resources: [] };

      const result = SkillPermissions.checkPermission(required, granted);

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Network access not granted');
    });

    it('should detect missing filesystem permission', () => {
      const required = { network: false, filesystem: ['write'] as ('read' | 'write')[], skills: [], resources: [] };
      const granted = { network: false, filesystem: ['read'] as ('read' | 'write')[], skills: [], resources: [] };

      const result = SkillPermissions.checkPermission(required, granted);

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Filesystem write permission not granted');
    });

    it('should detect missing skill permission', () => {
      const required = { network: false, filesystem: [] as ('read' | 'write')[], skills: ['skill-a'], resources: [] };
      const granted = { network: false, filesystem: [] as ('read' | 'write')[], skills: ['skill-b'], resources: [] };

      const result = SkillPermissions.checkPermission(required, granted);

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Cannot invoke skill: skill-a');
    });

    it('should detect missing resource permission', () => {
      const required = { network: false, filesystem: [] as ('read' | 'write')[], skills: [], resources: ['resource-a'] };
      const granted = { network: false, filesystem: [] as ('read' | 'write')[], skills: [], resources: ['resource-b'] };

      const result = SkillPermissions.checkPermission(required, granted);

      expect(result.allowed).toBe(false);
      expect(result.violations).toContain('Cannot access resource: resource-a');
    });
  });

  describe('Skill Types', () => {
    it('should define valid parameter types', () => {
      const validTypes = ['string', 'number', 'boolean', 'array', 'object'] as const;
      
      validTypes.forEach(type => {
        expect(type).toBeDefined();
      });
    });

    it('should create valid skill result', () => {
      const result = {
        success: true,
        type: 'text' as const,
        content: 'Hello, World!',
        metadata: { timestamp: new Date() },
      };

      expect(result.success).toBe(true);
      expect(result.type).toBe('text');
      expect(result.content).toBe('Hello, World!');
    });

    it('should create valid skill context', () => {
      const context: Partial<SkillContext> = {
        user: {
          id: 'user-123',
          name: 'Test User',
          preferences: {},
        },
        conversation: {
          id: 'conv-123',
          history: [],
        },
        permissions: {
          canInvoke: () => true,
          canAccess: () => true,
          canNetwork: () => true,
        },
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
        reportProgress: vi.fn(),
      };

      expect(context.user).toBeDefined();
      expect(context.conversation).toBeDefined();
      expect(context.permissions).toBeDefined();
      expect(context.logger).toBeDefined();
    });
  });
});
