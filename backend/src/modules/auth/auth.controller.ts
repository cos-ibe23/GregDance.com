import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ✅ REGISTER
  @Post('register')
  register(@Body() body: any) {
    return this.authService.register({
      matricNo: body.matricNo,
      name: body.name,
      college: body.college,
      department: body.department,
      course: body.course,
      courseCode: body.courseCode,
      password: body.password,
      faceImage: body.faceImage,
    });
  }

  // ✅ LOGIN
  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.matricNo, body.password);
  }
}