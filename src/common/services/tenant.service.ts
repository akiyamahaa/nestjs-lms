import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaClient } from 'generated/prisma';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  constructor(
    private tenantPrismaService: TenantPrismaService,
    private defaultPrismaService: PrismaService,
    @Inject(REQUEST) private request: Request & { databaseUrl?: string }
  ) {}

  async getPrismaClient(): Promise<PrismaClient> {
    console.log('TenantService - databaseUrl:', this.request.databaseUrl);
    console.log('TenantService - tenantId:', this.request.headers['x-tenant-id']);
    
    if (this.request.databaseUrl) {
      return await this.tenantPrismaService.getClient(this.request.databaseUrl);
    }
    console.log('TenantService - Fallback to default database');
    return this.defaultPrismaService;
  }

  getTenantId(): string | undefined {
    const tenantId = this.request.headers['x-tenant-id'] as string;
    return tenantId || 'LMS'; // Default tenant
  }

  getDatabaseUrl(): string | undefined {
    return this.request.databaseUrl;
  }
}