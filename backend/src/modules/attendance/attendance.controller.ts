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

  // ✅ GET ALL (UNCHANGED)
  @Get()
  getAll() {
    return this.attendanceService.getAll();
  }
  // 🔥 ADD BELOW EXPORT OR BELOW GET ALL

@Post('admin/login')
login(@Body() body: any) {
  if (body.password === 'admin123') {
    return { success: true };
  }
  return { success: false };
}

  // 🔥 ADDED: GET COURSES FROM DB


  // ✅ CHECK-IN (UPDATED BUT BACKWARD COMPATIBLE)
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

  // ✅ REGISTER FACE (UNCHANGED)
  @Post('register-face')
  registerFace(
    @Body('studentId') studentId: string,
    @Body('faceImage') faceImage: string,
  ) {
    return this.attendanceService.registerFace(studentId, faceImage);
  }

  // ✅ CHECK-OUT (UNCHANGED)
  @Post('check-out')
  async checkOut(@Body('studentId') studentId: string) {
    return this.attendanceService.checkOut(studentId);
  }

  // ✅ EXPORT EXCEL (UNCHANGED)
  @Get('export')
  async exportExcel(@Res() res: Response) {
    const filePath = await this.attendanceService.exportToExcel();
    return res.download(filePath);
  }
}
