import { TRANSLATE } from '@/common/auth/permissions';
import { ApiSuccess, Permissions } from '@/common/decorators';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TranslationHistoryFilterDto } from './dto/translation-history-filter.dto';
import { UpdateTranslationHistoryDto } from './dto/update-translation-history.dto';
import { TranslationHistoryService } from './service/translation-history.service';

@ApiTags('translation-history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate/history')
export class TranslationHistoryController {
  constructor(
    private readonly translationHistoryService: TranslationHistoryService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles([Role.ADMIN])
  @ApiOperation({
    summary: 'Admin xem lịch sử và thống kê dịch văn bản',
    description:
      'Trả về dữ liệu nguồn, dữ liệu dịch và thống kê số lượt dịch. Chỉ ADMIN được truy xuất.',
  })
  @ApiSuccess('Lấy lịch sử dịch thành công')
  async findAll(@Query() filter: TranslationHistoryFilterDto) {
    return this.translationHistoryService.findAll(filter);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions([TRANSLATE.UPDATE_HISTORY])
  @ApiOperation({
    summary: 'Chỉnh sửa bản dịch đã lưu',
    description:
      'Cho phép người tạo bản dịch hoặc ADMIN lưu bản dịch đã chỉnh sửa để xem lại trong lịch sử.',
  })
  @ApiSuccess('Cập nhật bản dịch thành công')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTranslationHistoryDto,
    @User('id') userId: string,
    @User('role') role: Role,
  ) {
    return this.translationHistoryService.update({
      id,
      translatedText: dto.translated_text,
      editorId: userId,
      editorRole: role,
    });
  }
}
