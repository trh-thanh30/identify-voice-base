import { BadRequestError } from '@/common/response';
import { BaseUseCase } from '@/shared/interfaces/base-usecase.interface';
import { Injectable } from '@nestjs/common';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { UsersRepository } from '../repository/users.repository';

interface UpdateAccountInput {
  userId: string;
  dto: UpdateAccountDto;
}

@Injectable()
export class UpdateAccountUseCase implements BaseUseCase<
  UpdateAccountInput,
  any
> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(input: UpdateAccountInput) {
    const { userId, dto } = input;
    const user = await this.usersRepository.findByIdOrThrow(userId);

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.usersRepository.findByEmail(dto.email);
      if (emailExists) {
        throw new BadRequestError('Email đã tồn tại trong hệ thống');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.usersRepository.findByUsername(
        dto.username,
      );
      if (usernameExists) {
        throw new BadRequestError('Tên đăng nhập đã tồn tại trong hệ thống');
      }
    }

    const updatedUser = await this.usersRepository.update(userId, {
      email: dto.email,
      username: dto.username,
    });

    return this.usersRepository.serializeAccount(updatedUser);
  }
}
