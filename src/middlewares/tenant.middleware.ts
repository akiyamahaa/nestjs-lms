import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      tenantId = 'LMS'; // Default tenant ID if not provided
    }
    // Lấy databaseUrl từ config hoặc env
    const databaseUrl = process.env[`DATABASE_URL_${tenantId.toUpperCase()}`];
    if (!databaseUrl) return res.status(400).json({ message: 'Invalid tenant id' });

    (req as any).databaseUrl = databaseUrl;
    next();
  }
}