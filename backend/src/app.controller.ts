import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHome() {
    return {
      message: 'GregDance Backend Running 🚀',
    };
  }
}