export function getFullUrl(path: string): string | null {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
  if (!path) return null;
  // Nếu path đã là url tuyệt đối thì giữ nguyên
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}
