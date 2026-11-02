import { randomUUID } from 'node:crypto'
import { Controller, Get, Param, Req } from '@nestjs/common'
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'
import type { Request } from 'express'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { DocumentsService } from './documents.service.js'
import type { DocumentsResponse } from './dto/response.schema.js'
import { type Vin, vinSchema } from './dto/vin.schema.js'

type RequestWithId = Request & { id?: string }

const responseExample = {
  vin: '1HGCM82633A004352',
  documents: [
    {
      id: 'SALES:SL-2024-001',
      source: 'SALES',
      type: 'CONTRACT',
      title: 'Vehicle Purchase Agreement',
      issuedAt: '2024-03-12',
      amount: 28500,
      currency: 'USD',
      url: 'https://sales.example.com/docs/SL-2024-001.pdf',
    },
  ],
  meta: {
    status: 'COMPLETE',
    sources: { SALES: 'OK', SERVICE: 'OK' },
    durationMs: 78,
  },
} satisfies DocumentsResponse

const vinPipe = new ZodValidationPipe(vinSchema)

@ApiTags('documents')
@ApiHeader({
  name: 'x-correlation-id',
  required: false,
  description: 'Echoed in the response header, the logs and the audit row.',
})
@Controller('v1/vehicles')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get(':vin/documents')
  @ApiOperation({ summary: 'List all documents known for a vehicle' })
  @ApiParam({
    name: 'vin',
    example: '1HGCM82633A004352',
    description: '17-character VIN (A-Z, 0-9, excluding I, O and Q)',
  })
  @ApiOkResponse({
    description:
      'Documents from one or both sources. Read meta.status to know if the list is complete.',
    schema: { example: responseExample },
  })
  @ApiBadRequestResponse({
    description: 'VIN is malformed. No upstream call is made.',
    schema: {
      example: {
        message: 'Validation failed',
        errors: [{ path: 'vin', message: 'VIN must be 17 characters...' }],
      },
    },
  })
  @ApiBadGatewayResponse({
    description: 'Both upstream systems failed. The search is still audited.',
    schema: {
      example: {
        statusCode: 502,
        message: 'Both document sources are unavailable',
        sources: { SALES: 'ERROR', SERVICE: 'TIMEOUT' },
      },
    },
  })
  search(
    @Param('vin', vinPipe) vin: Vin,
    @Req() request: RequestWithId,
  ): Promise<DocumentsResponse> {
    return this.documents.search(vin, request.id ?? randomUUID())
  }
}
