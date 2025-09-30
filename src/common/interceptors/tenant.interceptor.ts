import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get tenant ID from header
    let tenantId = request.headers['x-tenant-id'] as string;
    if (!tenantId) {
      tenantId = 'LMS'; // Default tenant ID
    }
    
    // Get database URL from environment
    const databaseUrl = process.env[`DATABASE_URL_${tenantId.toUpperCase()}`];
    if (!databaseUrl) {
      throw new BadRequestException(`Invalid tenant ID: ${tenantId}`);
    }
    
    // Attach database URL to request object
    (request as any).databaseUrl = databaseUrl;
    (request as any).tenantId = tenantId;
    
    return next.handle();
  }
}