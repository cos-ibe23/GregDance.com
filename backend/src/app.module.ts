import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppController } from './app.controller';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PrismaService } from './database/prisma.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule, UsersModule, AttendanceModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}