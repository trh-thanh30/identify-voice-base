import { PrismaService } from '@/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { TranslationHistoryFilterDto } from '../dto/translation-history-filter.dto';

@Injectable()
export class TranslationHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.translation_recordsUncheckedCreateInput) {
    return this.prisma.translation_records.create({ data });
  }

  async findAll(filter: TranslationHistoryFilterDto) {
    const page = filter.page ?? 1;
    const pageSize = filter.page_size ?? 10;
    const where = this.buildWhere(filter);
    const todayWhere = this.buildWhere({
      source_lang: filter.source_lang,
      target_lang: filter.target_lang,
    });

    const [items, total, byTargetLang, byMode, todayCount] = await Promise.all([
      this.prisma.translation_records.findMany({
        where,
        include: {
          operator: {
            select: { id: true, email: true, username: true, role: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.translation_records.count({ where }),
      this.prisma.translation_records.groupBy({
        by: ['target_lang'],
        where,
        _count: { _all: true },
        orderBy: { target_lang: 'asc' },
      }),
      this.prisma.translation_records.groupBy({
        by: ['mode'],
        where,
        _count: { _all: true },
        orderBy: { mode: 'asc' },
      }),
      this.prisma.translation_records.count({
        where: {
          ...todayWhere,
          created_at: this.getTodayRange(),
        },
      }),
    ]);

    return {
      items,
      stats: {
        total,
        today_count: todayCount,
        by_target_lang: byTargetLang.map((item) => ({
          target_lang: item.target_lang,
          count: item._count._all,
        })),
        by_mode: byMode.map((item) => ({
          mode: item.mode,
          count: item._count._all,
        })),
      },
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  private buildWhere(
    filter: TranslationHistoryFilterDto,
  ): Prisma.translation_recordsWhereInput {
    return {
      ...((filter.from_date || filter.to_date) && {
        created_at: {
          ...(filter.from_date && { gte: new Date(filter.from_date) }),
          ...(filter.to_date && { lte: new Date(filter.to_date) }),
        },
      }),
      ...(filter.source_lang && { source_lang: filter.source_lang }),
      ...(filter.target_lang && { target_lang: filter.target_lang }),
    };
  }

  private getTodayRange() {
    return {
      gte: dayjs().startOf('day').toDate(),
      lte: dayjs().endOf('day').toDate(),
    };
  }
}
