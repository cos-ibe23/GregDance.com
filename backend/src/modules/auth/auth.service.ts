import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ✅ REGISTER STUDENT
  async register(data: {
    matricNo: string;
    name: string;
    college: string;
    department: string;
    course: string;
    courseCode: string;
    password: string;
    faceImage?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const student = await this.prisma.student.create({
      data: {
        matricNo: data.matricNo,
        name: data.name,
        college: data.college,
        department: data.department,
        course: data.course,
        courseCode: data.courseCode,
        password: hashedPassword,
        faceImage: data.faceImage,
      },
    });

    return student;
  }

  // ✅ LOGIN
  async login(matricNo: string, password: string) {
    const student = await this.prisma.student.findUnique({
      where: { matricNo },
    });

    if (!student) {
      throw new Error('Student not found');
    }

   if (!student.password) {
  throw new Error("No password set for this student");
}

const valid = await bcrypt.compare(password, student.password);

    if (!valid) {
      throw new Error('Invalid credentials');
    }

    return student;
  }
}