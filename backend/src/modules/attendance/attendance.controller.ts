import {
  Controller,
  Post,
  Get,
  Body,
  Res,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Response } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  // ✅ GET ALL RECORDS
  @Get()
  getAll() {
    return this.attendanceService.getAll();
  }

  // ✅ ADMIN LOGIN
  @Post('admin/login')
  login(@Body() body: any) {
    if (body.password === 'admin123') {
      return { success: true };
    }
    return { success: false };
  }

  // ✅ CHECK-IN
  @Post('check-in')
  async checkIn(@Body() body: any) {
    console.log("📥 CONTROLLER BODY:", body);

    return this.attendanceService.checkIn(
      body.studentId,
      body.faceImage,
      body.frames,
      body.name,
      body.matricNo,
      body.courseName,
      body.courseCode,
      body.college,
      body.department,
    );
  }

  // ✅ REGISTER FACE
  @Post('register-face')
  registerFace(
    @Body('studentId') studentId: string,
    @Body('faceImage') faceImage: string,
  ) {
    return this.attendanceService.registerFace(studentId, faceImage);
  }

  // ✅ CHECK-OUT
  @Post('check-out')
  async checkOut(@Body('studentId') studentId: string) {
    return this.attendanceService.checkOut(studentId);
  }

  // ✅ EXPORT EXCEL
  @Get('export')
  async exportExcel(@Res() res: Response) {
    const filePath = await this.attendanceService.exportToExcel();
    return res.download(filePath);
  }
}