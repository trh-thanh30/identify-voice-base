import { ApiSuccess } from '@/common/decorators';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TranslationHistoryFilterDto } from './dto/translation-history-filter.dto';
import { TranslationHistoryService } from './service/translation-history.service';

@ApiTags('translation-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles([Role.ADMIN])
@Controller('translate/history')
export class TranslationHistoryController {
  constructor(
    private readonly translationHistoryService: TranslationHistoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Admin xem lịch sử và thống kê dịch văn bản',
    description:
      'Trả về dữ liệu nguồn, dữ liệu dịch và thống kê số lượt dịch. Chỉ ADMIN được truy xuất.',
  })
  @ApiSuccess('Lấy lịch sử dịch thành công')
  async findAll(@Query() filter: TranslationHistoryFilterDto) {
    return this.translationHistoryService.findAll(filter);
  }
}
