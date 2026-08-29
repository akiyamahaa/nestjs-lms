import { User } from '@prisma/client'; // Import kiểu User từ Prisma (hoặc định nghĩa riêng nếu cần)

declare global {
  namespace Express {
    interface Request {
      user?: User; // Thêm thuộc tính user vào Request
      databaseUrl?: string;
      chatbotCode?: string;
    }
  }
}