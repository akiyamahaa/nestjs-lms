import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class TenantPrismaService {
  private clients = new Map<string, PrismaClient>();

  async getClient(databaseUrl: string): Promise<PrismaClient> {
    if (!databaseUrl || !databaseUrl.startsWith('postgres')) {
      throw new Error(`Invalid database URL: ${databaseUrl}`);
    }
    
    if (!this.clients.has(databaseUrl)) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });
      await client.$connect();
      this.clients.set(databaseUrl, client);
    }
    return this.clients.get(databaseUrl)!;
  }

  async onModuleDestroy() {
    // Disconnect all clients
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.$disconnect()
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
  }
}