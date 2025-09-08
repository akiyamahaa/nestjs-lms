import { PrismaClient } from '@prisma/client';

export function getFullUrl(path: string | null): string | null {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
  if (!path) return null;
  // Nếu path đã là url tuyệt đối thì giữ nguyên
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}

export async function getSettingValue(prisma: PrismaClient, key: string): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting ? Number(setting.value) : 0;
}
