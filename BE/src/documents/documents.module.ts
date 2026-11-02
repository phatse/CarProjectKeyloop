import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { SalesAdapter } from './adapters/sales.adapter.js'
import { ServiceAdapter } from './adapters/service.adapter.js'
import { DocumentsController } from './documents.controller.js'
import { DocumentsService } from './documents.service.js'
import { SearchAuditRepository } from './search-audit.repository.js'

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [SalesAdapter, ServiceAdapter, SearchAuditRepository, DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
