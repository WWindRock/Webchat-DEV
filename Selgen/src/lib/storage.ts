import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const BASE_UPLOAD_DIR = path.join(os.homedir(), '.copaw', 'upload');
const MAX_STORAGE_SIZE = 1024 * 1024 * 1024; // 1GB

export async function saveFile(
  file: File,
  username: string,
  chatId: string
): Promise<{ url: string; filename: string; size: number }> {
  const userDir = path.join(BASE_UPLOAD_DIR, username);
  const chatDir = path.join(userDir, chatId);

  // Ensure directories exist
  await fs.mkdir(chatDir, { recursive: true });

  // Check quota
  const userSize = await getDirectorySize(userDir);
  if (userSize + file.size > MAX_STORAGE_SIZE) {
    await freeSpace(userDir, file.size);
    
    // Double check
    const newUserSize = await getDirectorySize(userDir);
    if (newUserSize + file.size > MAX_STORAGE_SIZE) {
        throw new Error('Storage quota exceeded');
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const existing = await findDuplicateFile(userDir, buffer, file.size);
  if (existing) {
    const fileUrl = existing.relativeDir
      ? `/api/uploads/${username}/${existing.relativeDir}/${existing.filename}`
      : `/api/uploads/${username}/${existing.filename}`;
    return {
      url: fileUrl,
      filename: existing.originalName,
      size: file.size
    };
  }
  const timestamp = Date.now();
  // Sanitize filename
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${safeFilename}`;
  const filepath = path.join(chatDir, filename);

  await fs.writeFile(filepath, buffer);

  // URL format: /api/uploads/username/chatId/filename
  const fileUrl = `/api/uploads/${username}/${chatId}/${filename}`;
  
  return {
    url: fileUrl,
    filename: file.name,
    size: file.size
  };
}

async function findDuplicateFile(
  userDir: string,
  buffer: Buffer,
  size: number
): Promise<{ relativeDir: string; filename: string; originalName: string } | null> {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const files = await getAllFiles(userDir);
  for (const file of files) {
    if (file.size !== size) continue;
    try {
      const existingBuffer = await fs.readFile(file.path);
      const existingHash = crypto.createHash('sha256').update(existingBuffer).digest('hex');
      if (existingHash === hash) {
        const relativePath = path.relative(userDir, file.path);
        const relativeDir = path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath);
        const filename = path.basename(file.path);
        return { relativeDir, filename, originalName: file.originalName || filename };
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        size += stats.size;
      }
    }
  } catch (e) {
    // Directory might not exist yet
    return 0;
  }
  return size;
}

async function freeSpace(userDir: string, requiredSpace: number) {
  // Find all files in userDir (recursively), sort by mtime, delete oldest until space is freed
  const files = await getAllFiles(userDir);
  files.sort((a, b) => a.mtime.getTime() - b.mtime.getTime()); // Oldest first

  let freed = 0;
  for (const file of files) {
    if (freed >= requiredSpace) break;
    try {
        await fs.unlink(file.path);
        freed += file.size;
    } catch (e) {
        console.error('Error deleting file:', file.path, e);
    }
  }
}

async function getAllFiles(dirPath: string): Promise<{ path: string; size: number; mtime: Date; originalName?: string }[]> {
  let fileList: { path: string; size: number; mtime: Date; originalName?: string }[] = [];
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        fileList = fileList.concat(await getAllFiles(filePath));
      } else {
        const stats = await fs.stat(filePath);
        fileList.push({ path: filePath, size: stats.size, mtime: stats.mtime, originalName: file.name });
      }
    }
  } catch (e) {
    return [];
  }
  return fileList;
}
