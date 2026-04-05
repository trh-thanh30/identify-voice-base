import { Injectable } from '@nestjs/common';
import { StartIdentifyDto } from '../dto/start-identify.dto';
import { StartIdentifySessionUseCase } from '../use-cases/start-identify-session.usecase';

@Injectable()
export class IdentifyService {
  constructor(
    private readonly startIdentifySessionUseCase: StartIdentifySessionUseCase,
  ) {}

  async startSession(dto: StartIdentifyDto, userId: string) {
    return this.startIdentifySessionUseCase.execute({ ...dto, userId });
  }

  // async getResult(_sessionId: string) {
  //   // Logic to retrieve results from identify_sessions table
  // }
}
