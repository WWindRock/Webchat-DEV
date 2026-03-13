import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as getSkills, POST as postSkills } from '@/app/api/skills/route';
import { GET as getJobs, DELETE as deleteJob } from '@/app/api/jobs/route';
import { NextRequest, NextResponse } from 'next/server';
import { skillLoader } from '@/skills/engine/loader';
import { submitSkillJob, getJobStatus, cancelJob } from '@/queue/job-queue';

// Mock dependencies
vi.mock('@/skills/engine/loader', () => ({
  skillLoader: {
    listSkills: vi.fn(),
    getSkill: vi.fn(),
    findByTrigger: vi.fn(),
  },
}));

vi.mock('@/queue/job-queue', () => ({
  submitSkillJob: vi.fn(),
  getJobStatus: vi.fn(),
  cancelJob: vi.fn(),
}));

describe('API Routes', () => {
  describe('Skills API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('GET /api/skills', () => {
      it('should return list of skills', async () => {
        const mockSkills = [
          {
            name: 'code-assistant',
            displayName: 'Code Assistant',
            description: 'Helps with coding tasks',
            version: '1.0.0',
            metadata: {
              categories: ['development'],
              tags: ['code', 'programming'],
            },
            permissions: { network: true, filesystem: ['read'], skills: [], resources: [] },
            manifest: { type: 'function', function: { name: 'code-assistant' } },
          },
        ];

        vi.mocked(skillLoader.listSkills).mockReturnValue(mockSkills as any);

        const request = new NextRequest('http://localhost:3000/api/skills');
        const response = await getSkills(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('code-assistant');
        expect(data.meta.total).toBe(1);
      });

      it('should filter skills by category', async () => {
        const mockSkills = [
          {
            name: 'code-assistant',
            displayName: 'Code Assistant',
            description: 'Helps with coding tasks',
            version: '1.0.0',
            metadata: {
              categories: ['development'],
              tags: [],
            },
            permissions: {},
            manifest: {},
          },
          {
            name: 'image-generator',
            displayName: 'Image Generator',
            description: 'Generates images',
            version: '1.0.0',
            metadata: {
              categories: ['creative'],
              tags: [],
            },
            permissions: {},
            manifest: {},
          },
        ];

        vi.mocked(skillLoader.listSkills).mockReturnValue(mockSkills as any);

        const request = new NextRequest('http://localhost:3000/api/skills?category=development');
        const response = await getSkills(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].name).toBe('code-assistant');
      });

      it('should find skill by trigger', async () => {
        const mockSkill = {
          name: 'code-assistant',
          displayName: 'Code Assistant',
          description: 'Helps with coding tasks',
          version: '1.0.0',
          metadata: {
            categories: [],
            tags: [],
          },
          permissions: {},
          manifest: {},
        };

        vi.mocked(skillLoader.listSkills).mockReturnValue([mockSkill] as any);
        vi.mocked(skillLoader.findByTrigger).mockReturnValue(mockSkill as any);

        const request = new NextRequest('http://localhost:3000/api/skills?trigger=/code');
        const response = await getSkills(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
      });

      it('should return empty array when no skills match trigger', async () => {
        vi.mocked(skillLoader.listSkills).mockReturnValue([] as any);
        vi.mocked(skillLoader.findByTrigger).mockReturnValue(undefined);

        const request = new NextRequest('http://localhost:3000/api/skills?trigger=/unknown');
        const response = await getSkills(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(0);
      });

      it('should handle errors gracefully', async () => {
        vi.mocked(skillLoader.listSkills).mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = new NextRequest('http://localhost:3000/api/skills');
        const response = await getSkills(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('SKILLS_LIST_ERROR');
        expect(data.error.message).toBe('Database error');
      });
    });

    describe('POST /api/skills', () => {
      it('should queue a skill job', async () => {
        const mockSkill = {
          name: 'code-assistant',
          displayName: 'Code Assistant',
          description: 'Helps with coding tasks',
          version: '1.0.0',
        };

        vi.mocked(skillLoader.getSkill).mockReturnValue(mockSkill as any);
        vi.mocked(submitSkillJob).mockResolvedValue('job-123');

        const request = new NextRequest('http://localhost:3000/api/skills', {
          method: 'POST',
          body: JSON.stringify({
            skillName: 'code-assistant',
            params: { code: 'console.log("hello")' },
            userId: 'user-123',
          }),
        });

        const response = await postSkills(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.jobId).toBe('job-123');
        expect(data.data.status).toBe('queued');
        expect(submitSkillJob).toHaveBeenCalledWith(
          'code-assistant',
          { code: 'console.log("hello")' },
          'user-123'
        );
      });

      it('should return 400 when skill name is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/skills', {
          method: 'POST',
          body: JSON.stringify({
            params: { code: 'test' },
            userId: 'user-123',
          }),
        });

        const response = await postSkills(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_SKILL_NAME');
      });

      it('should return 404 when skill not found', async () => {
        vi.mocked(skillLoader.getSkill).mockReturnValue(undefined);

        const request = new NextRequest('http://localhost:3000/api/skills', {
          method: 'POST',
          body: JSON.stringify({
            skillName: 'non-existent-skill',
            params: {},
            userId: 'user-123',
          }),
        });

        const response = await postSkills(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('SKILL_NOT_FOUND');
      });

      it('should use default values for optional parameters', async () => {
        const mockSkill = {
          name: 'code-assistant',
          displayName: 'Code Assistant',
          description: 'Helps with coding tasks',
          version: '1.0.0',
        };

        vi.mocked(skillLoader.getSkill).mockReturnValue(mockSkill as any);
        vi.mocked(submitSkillJob).mockResolvedValue('job-456');

        const request = new NextRequest('http://localhost:3000/api/skills', {
          method: 'POST',
          body: JSON.stringify({
            skillName: 'code-assistant',
          }),
        });

        const response = await postSkills(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(submitSkillJob).toHaveBeenCalledWith('code-assistant', {}, 'anonymous');
      });

      it('should handle errors gracefully', async () => {
        const mockSkill = {
          name: 'code-assistant',
          displayName: 'Code Assistant',
          description: 'Helps with coding tasks',
          version: '1.0.0',
        };

        vi.mocked(skillLoader.getSkill).mockReturnValue(mockSkill as any);
        vi.mocked(submitSkillJob).mockRejectedValue(new Error('Queue error'));

        const request = new NextRequest('http://localhost:3000/api/skills', {
          method: 'POST',
          body: JSON.stringify({
            skillName: 'code-assistant',
            params: {},
            userId: 'user-123',
          }),
        });

        const response = await postSkills(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('SKILL_EXECUTION_ERROR');
      });
    });
  });

  describe('Jobs API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('GET /api/jobs', () => {
      it('should return job status', async () => {
        const mockStatus = {
          jobId: 'job-123',
          status: 'completed',
          progress: 100,
          result: { success: true, type: 'text', content: 'Done' },
        };

        vi.mocked(getJobStatus).mockResolvedValue(mockStatus as any);

        const request = new NextRequest('http://localhost:3000/api/jobs?id=job-123');
        const response = await getJobs(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.jobId).toBe('job-123');
        expect(data.data.status).toBe('completed');
      });

      it('should return 400 when job id is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/jobs');
        const response = await getJobs(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_JOB_ID');
      });

      it('should return 404 when job not found', async () => {
        vi.mocked(getJobStatus).mockRejectedValue(new Error('Job not found'));

        const request = new NextRequest('http://localhost:3000/api/jobs?id=non-existent');
        const response = await getJobs(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('JOB_NOT_FOUND');
      });

      it('should handle general errors', async () => {
        vi.mocked(getJobStatus).mockRejectedValue(new Error('Database error'));

        const request = new NextRequest('http://localhost:3000/api/jobs?id=job-123');
        const response = await getJobs(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('JOB_STATUS_ERROR');
      });
    });

    describe('DELETE /api/jobs', () => {
      it('should cancel a job', async () => {
        vi.mocked(cancelJob).mockResolvedValue(true);

        const request = new NextRequest('http://localhost:3000/api/jobs?id=job-123', {
          method: 'DELETE',
        });

        const response = await deleteJob(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.jobId).toBe('job-123');
        expect(data.data.status).toBe('cancelled');
        expect(cancelJob).toHaveBeenCalledWith('job-123');
      });

      it('should return 400 when job id is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/jobs', {
          method: 'DELETE',
        });

        const response = await deleteJob(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('MISSING_JOB_ID');
      });

      it('should return 404 when job not found or already completed', async () => {
        vi.mocked(cancelJob).mockResolvedValue(false);

        const request = new NextRequest('http://localhost:3000/api/jobs?id=job-123', {
          method: 'DELETE',
        });

        const response = await deleteJob(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('JOB_NOT_FOUND');
      });

      it('should handle errors gracefully', async () => {
        vi.mocked(cancelJob).mockRejectedValue(new Error('Queue error'));

        const request = new NextRequest('http://localhost:3000/api/jobs?id=job-123', {
          method: 'DELETE',
        });

        const response = await deleteJob(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('JOB_CANCEL_ERROR');
      });
    });
  });

  describe('API Response Types', () => {
    it('should have correct success response structure', async () => {
      vi.mocked(skillLoader.listSkills).mockReturnValue([] as any);

      const request = new NextRequest('http://localhost:3000/api/skills');
      const response = await getSkills(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('meta');
      expect(typeof data.success).toBe('boolean');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.meta).toHaveProperty('total');
    });

    it('should have correct error response structure', async () => {
      vi.mocked(skillLoader.getSkill).mockReturnValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/skills', {
        method: 'POST',
        body: JSON.stringify({ skillName: 'unknown' }),
      });

      const response = await postSkills(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(typeof data.success).toBe('boolean');
      expect(data.success).toBe(false);
    });
  });
});
