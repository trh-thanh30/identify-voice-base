import { BcryptService } from '@/common/helpers/bcrypt.util';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuthTokenService } from '@/module/auth/service/auth-token.service';
import { Module } from '@nestjs/common';
import { AdminAccountsController } from './admin-accounts.controller';
import { UsersRepository } from './repository/users.repository';
import { UserService } from './service/user.service';
import { AdminCreateAccountUseCase } from './use-cases/admin-create-account.usecase';
import { AdminFindAllAccountsUseCase } from './use-cases/admin-find-all-accounts.usecase';
import { AdminGetAccountDetailUseCase } from './use-cases/admin-get-account-detail.usecase';
import { AdminUpdateAccountUseCase } from './use-cases/admin-update-account.usecase';
import { DeleteAccountUseCase } from './use-cases/delete-account.usecase';
import { GetMeUseCase } from './use-cases/get-me.usecase';
import { UpdateAccountUseCase } from './use-cases/update-account.usecase';
import { UserAuthController } from './user-auth.controller';

@Module({
  controllers: [UserAuthController, AdminAccountsController],
  providers: [
    PrismaService,
    UsersRepository,
    UserService,
    GetMeUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    AdminCreateAccountUseCase,
    AdminFindAllAccountsUseCase,
    AdminGetAccountDetailUseCase,
    AdminUpdateAccountUseCase,
    BcryptService,
    AuthTokenService,
  ],
  exports: [UserService],
})
export class UserAuthModule {}
