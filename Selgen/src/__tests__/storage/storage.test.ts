import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TOSClient, TOSUploadOptions } from '@/storage/tos-client';
import { AssetManager } from '@/storage/asset-manager';
import type { AssetMetadata } from '@/storage/asset-manager';

describe('Storage', () => {
  describe('TOSClient', () => {
    let client: TOSClient;
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        TOS_ENDPOINT: 'tos.example.com',
        TOS_BUCKET: 'test-bucket',
        VOLCENGINE_ACCESS_KEY: 'test-access-key',
        VOLCENGINE_SECRET_KEY: 'test-secret-key',
        VOLCENGINE_REGION: 'cn-beijing',
      };
      client = new TOSClient();
      vi.clearAllMocks();
    });

    afterEach(() => {
      process.env = originalEnv;
      vi.restoreAllMocks();
    });

    it('should create a TOS client instance', () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(TOSClient);
    });

    it('should use environment variables for configuration', () => {
      const client = new TOSClient();
      expect(client).toBeDefined();
    });

    it('should use default values when env vars are not set', () => {
      delete process.env.TOS_ENDPOINT;
      delete process.env.TOS_BUCKET;
      delete process.env.VOLCENGINE_ACCESS_KEY;
      delete process.env.VOLCENGINE_SECRET_KEY;
      delete process.env.VOLCENGINE_REGION;

      const client = new TOSClient();
      expect(client).toBeDefined();
    });

    it('should upload file with default storage policy', async () => {
      const buffer = Buffer.from('test content');
      const options: TOSUploadOptions = {
        content: buffer,
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
      };

      const result = await client.upload(options);

      expect(result.success).toBe(true);
      expect(result.fileUrl).toBeDefined();
      expect(result.tosPath).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should upload file with custom storage policy', async () => {
      const buffer = Buffer.from('test content');
      const options: TOSUploadOptions = {
        content: buffer,
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '30d',
      };

      const result = await client.upload(options);

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();
    });

    it('should upload file with permanent storage policy', async () => {
      const buffer = Buffer.from('test content');
      const options: TOSUploadOptions = {
        content: buffer,
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: 'permanent',
      };

      const result = await client.upload(options);

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeUndefined();
    });

    it('should upload file with custom path', async () => {
      const buffer = Buffer.from('test content');
      const options: TOSUploadOptions = {
        content: buffer,
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        customPath: 'custom/path/file.txt',
      };

      const result = await client.upload(options);

      expect(result.success).toBe(true);
      expect(result.tosPath).toBe('custom/path/file.txt');
    });

    it('should include metadata in upload result', async () => {
      const buffer = Buffer.from('test content');
      const customMetadata = { key: 'value' };
      const options: TOSUploadOptions = {
        content: buffer,
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        metadata: customMetadata,
      };

      const result = await client.upload(options);

      expect(result.success).toBe(true);
      expect(result.metadata).toMatchObject(customMetadata);
      expect(result.metadata.userId).toBe('user-123');
      expect(result.metadata.skillName).toBe('test-skill');
      expect(result.metadata.assetType).toBe('user_upload');
    });

    it('should generate valid file URL', async () => {
      const tosPath = 'user-123/skill/test.txt';
      const url = await client.getUrl(tosPath);

      expect(url).toContain('test-bucket');
      expect(url).toContain('tos.example.com');
      expect(url).toContain(tosPath);
    });

    it('should return empty metadata for getMetadata', async () => {
      const metadata = await client.getMetadata('some/path');
      expect(metadata).toEqual({});
    });

    it('should return true for delete operation', async () => {
      const result = await client.delete('some/path');
      expect(result).toBe(true);
    });
  });

  describe('AssetManager', () => {
    let tosClient: TOSClient;
    let manager: AssetManager;

    beforeEach(() => {
      process.env = {
        ...process.env,
        TOS_ENDPOINT: 'tos.example.com',
        TOS_BUCKET: 'test-bucket',
      };
      tosClient = new TOSClient();
      manager = new AssetManager(tosClient);
    });

    it('should create an asset manager instance', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(AssetManager);
    });

    it('should register an asset', async () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/file.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-123/test-skill/file.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-123/test-skill/file.txt',
          cdnUrl: 'https://cdn.example.com/user-123/test-skill/file.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata);
      const retrieved = await manager.getAsset('/path/to/file.txt');

      expect(retrieved).toBeDefined();
      expect(retrieved?.filePath).toBe('/path/to/file.txt');
    });

    it('should return undefined for non-existent asset', async () => {
      const asset = await manager.getAsset('/non/existent/file.txt');
      expect(asset).toBeUndefined();
    });

    it('should list all assets', async () => {
      const metadata1: AssetMetadata = {
        filePath: '/path/to/file1.txt',
        userId: 'user-1',
        skillName: 'skill-a',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file1.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/skill-a/file1.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/skill-a/file1.txt',
          cdnUrl: 'https://cdn.example.com/user-1/skill-a/file1.txt',
        },
        customMetadata: {},
      };

      const metadata2: AssetMetadata = {
        filePath: '/path/to/file2.txt',
        userId: 'user-2',
        skillName: 'skill-b',
        assetType: 'api_result',
        storagePolicy: '30d',
        uploadTime: new Date(Date.now() - 1000).toISOString(),
        fileInfo: {
          originalFilename: 'file2.txt',
          fileSize: 200,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-2/skill-b/file2.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-2/skill-b/file2.txt',
          cdnUrl: 'https://cdn.example.com/user-2/skill-b/file2.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata1);
      await manager.registerAsset(metadata2);

      const assets = await manager.listAssets();

      expect(assets).toHaveLength(2);
      expect(assets[0].filePath).toBe('/path/to/file1.txt'); // Sorted by upload time desc
    });

    it('should filter assets by userId', async () => {
      const metadata1: AssetMetadata = {
        filePath: '/path/to/file1.txt',
        userId: 'user-1',
        skillName: 'skill-a',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file1.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/skill-a/file1.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/skill-a/file1.txt',
          cdnUrl: 'https://cdn.example.com/user-1/skill-a/file1.txt',
        },
        customMetadata: {},
      };

      const metadata2: AssetMetadata = {
        filePath: '/path/to/file2.txt',
        userId: 'user-2',
        skillName: 'skill-b',
        assetType: 'api_result',
        storagePolicy: '30d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file2.txt',
          fileSize: 200,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-2/skill-b/file2.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-2/skill-b/file2.txt',
          cdnUrl: 'https://cdn.example.com/user-2/skill-b/file2.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata1);
      await manager.registerAsset(metadata2);

      const assets = await manager.listAssets('user-1');

      expect(assets).toHaveLength(1);
      expect(assets[0].userId).toBe('user-1');
    });

    it('should filter assets by skillName', async () => {
      const metadata1: AssetMetadata = {
        filePath: '/path/to/file1.txt',
        userId: 'user-1',
        skillName: 'skill-a',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file1.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/skill-a/file1.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/skill-a/file1.txt',
          cdnUrl: 'https://cdn.example.com/user-1/skill-a/file1.txt',
        },
        customMetadata: {},
      };

      const metadata2: AssetMetadata = {
        filePath: '/path/to/file2.txt',
        userId: 'user-1',
        skillName: 'skill-b',
        assetType: 'api_result',
        storagePolicy: '30d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file2.txt',
          fileSize: 200,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/skill-b/file2.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/skill-b/file2.txt',
          cdnUrl: 'https://cdn.example.com/user-1/skill-b/file2.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata1);
      await manager.registerAsset(metadata2);

      const assets = await manager.listAssets('user-1', 'skill-a');

      expect(assets).toHaveLength(1);
      expect(assets[0].skillName).toBe('skill-a');
    });

    it('should search assets by query', async () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/document.txt',
        userId: 'user-1',
        skillName: 'document-processor',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'important-document.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/document-processor/document.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/document-processor/document.txt',
          cdnUrl: 'https://cdn.example.com/user-1/document-processor/document.txt',
        },
        customMetadata: { tag: 'urgent' },
      };

      await manager.registerAsset(metadata);

      const resultsByFilename = await manager.searchAssets('important');
      expect(resultsByFilename).toHaveLength(1);

      const resultsBySkill = await manager.searchAssets('processor');
      expect(resultsBySkill).toHaveLength(1);

      const resultsByMetadata = await manager.searchAssets('urgent');
      expect(resultsByMetadata).toHaveLength(1);

      const noResults = await manager.searchAssets('nonexistent');
      expect(noResults).toHaveLength(0);
    });

    it('should mark asset as favorite', async () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/file.txt',
        userId: 'user-1',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/test-skill/file.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/test-skill/file.txt',
          cdnUrl: 'https://cdn.example.com/user-1/test-skill/file.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata);
      const result = await manager.markAsFavorite('/path/to/file.txt');

      expect(result).toBe(true);

      const asset = await manager.getAsset('/path/to/file.txt');
      expect(asset?.assetType).toBe('user_favorite');
      expect(asset?.storagePolicy).toBe('permanent');
      expect(asset?.customMetadata.isFavorite).toBe(true);
      expect(asset?.expireTime).toBeUndefined();
    });

    it('should return false when marking non-existent asset as favorite', async () => {
      const result = await manager.markAsFavorite('/non/existent/file.txt');
      expect(result).toBe(false);
    });

    it('should extend retention period', async () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/file.txt',
        userId: 'user-1',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/test-skill/file.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/test-skill/file.txt',
          cdnUrl: 'https://cdn.example.com/user-1/test-skill/file.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata);
      const result = await manager.extendRetention('/path/to/file.txt', '90d');

      expect(result).toBe(true);

      const asset = await manager.getAsset('/path/to/file.txt');
      expect(asset?.storagePolicy).toBe('90d');
      expect(asset?.expireTime).toBeDefined();
    });

    it('should extend retention to permanent', async () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/file.txt',
        userId: 'user-1',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file.txt',
          fileSize: 100,
          fileCategory: 'document',
          mimeType: 'text/plain',
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'user-1/test-skill/file.txt',
          fileUrl: 'https://test-bucket.tos.example.com/user-1/test-skill/file.txt',
          cdnUrl: 'https://cdn.example.com/user-1/test-skill/file.txt',
        },
        customMetadata: {},
      };

      await manager.registerAsset(metadata);
      const result = await manager.extendRetention('/path/to/file.txt', 'permanent');

      expect(result).toBe(true);

      const asset = await manager.getAsset('/path/to/file.txt');
      expect(asset?.storagePolicy).toBe('permanent');
      expect(asset?.expireTime).toBeUndefined();
    });

    it('should return false when extending retention for non-existent asset', async () => {
      const result = await manager.extendRetention('/non/existent/file.txt', '90d');
      expect(result).toBe(false);
    });
  });

  describe('Storage Types', () => {
    it('should have valid TOS upload options structure', () => {
      const options: TOSUploadOptions = {
        content: Buffer.from('test'),
        filename: 'test.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '30d',
        customPath: 'custom/path',
        metadata: { key: 'value' },
      };

      expect(options.content).toBeInstanceOf(Buffer);
      expect(options.filename).toBe('test.txt');
      expect(options.userId).toBe('user-123');
      expect(options.skillName).toBe('test-skill');
      expect(options.assetType).toBe('user_upload');
      expect(options.storagePolicy).toBe('30d');
      expect(options.customPath).toBe('custom/path');
      expect(options.metadata).toEqual({ key: 'value' });
    });

    it('should have valid asset metadata structure', () => {
      const metadata: AssetMetadata = {
        filePath: '/path/to/file.txt',
        userId: 'user-123',
        skillName: 'test-skill',
        assetType: 'user_upload',
        storagePolicy: '14d',
        uploadTime: new Date().toISOString(),
        fileInfo: {
          originalFilename: 'file.txt',
          fileSize: 1024,
          fileCategory: 'document',
          mimeType: 'text/plain',
          dimensions: { width: 100, height: 100 },
        },
        tosInfo: {
          bucket: 'test-bucket',
          endpoint: 'tos.example.com',
          tosPath: 'path/to/file.txt',
          fileUrl: 'https://tos.example.com/file.txt',
          cdnUrl: 'https://cdn.example.com/file.txt',
        },
        customMetadata: { tag: 'important' },
      };

      expect(metadata.filePath).toBe('/path/to/file.txt');
      expect(metadata.userId).toBe('user-123');
      expect(metadata.skillName).toBe('test-skill');
      expect(metadata.fileInfo.dimensions).toBeDefined();
      expect(metadata.fileInfo.dimensions?.width).toBe(100);
    });

    it('should accept all valid asset types', () => {
      const validTypes = ['user_upload', 'api_result', 'user_favorite', 'temp_file', 'system_file'] as const;

      validTypes.forEach((type) => {
        const options: TOSUploadOptions = {
          content: Buffer.from('test'),
          filename: 'test.txt',
          userId: 'user-123',
          skillName: 'test-skill',
          assetType: type,
        };

        expect(options.assetType).toBe(type);
      });
    });

    it('should accept all valid storage policies', () => {
      const validPolicies = ['1d', '14d', '30d', '90d', '1y', 'permanent'] as const;

      validPolicies.forEach((policy) => {
        const options: TOSUploadOptions = {
          content: Buffer.from('test'),
          filename: 'test.txt',
          userId: 'user-123',
          skillName: 'test-skill',
          assetType: 'user_upload',
          storagePolicy: policy,
        };

        expect(options.storagePolicy).toBe(policy);
      });
    });
  });
});
