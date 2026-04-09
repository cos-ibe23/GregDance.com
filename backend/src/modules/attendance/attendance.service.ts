import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private saveBase64Image(base64: string): string {
    const matches = base64.match(/^data:image\/jpeg;base64,(.+)$/);

    if (!matches) {
      throw new Error('Invalid image format');
    }

    const buffer = Buffer.from(matches[1], 'base64');
    const folderPath = path.join(process.cwd(), 'faces');

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileName = `capture_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}.jpg`;

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, buffer);

    return path.resolve(filePath);
  }

  async findOrCreateStudent(name: string, matricNo: string) {
    let student = await this.prisma.student.findUnique({
      where: { matricNo },
    });

    if (!student) {
      student = await this.prisma.student.create({
        data: { name, matricNo },
      });
    }

    return student;
  }

  async ensureCourseExists(code: string) {
    if (!code) return;

    await this.prisma.course.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: code,
      },
    });
  }

  async checkIn(
    studentId: string,
    faceImage?: string,
    frames?: string[],
    name?: string,
    matricNo?: string,
    courseName?: string,
    courseCode?: string,
    college?: string,
    department?: string,
  ) {

console.log('📥 Incoming Data:', {
  studentId,
  name,
  matricNo,
  faceImage,
  frames,
  courseName,
  courseCode,
  college,
  department,
});
    
    if (!matricNo) {
      throw new Error('Matric number is required');
    }

    let student = await this.prisma.student.findUnique({
      where: { matricNo },
    });

    if (!student) {
      if (!name) throw new Error('Name is required');

      student = await this.prisma.student.create({
        data: {
          name: name || 'Unknown',
          matricNo,
        },
      });
    }

    studentId = student.id;

    if (courseCode) {
      await this.ensureCourseExists(courseCode);
    }

    const existing = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        checkOut: null,
      },
    });

    if (existing) {
      throw new Error('Already checked in');
    }

    if (!student.faceImage) {
      let referenceSource = faceImage;

      if (!referenceSource && frames && frames.length > 0) {
        referenceSource = frames[0];
      }

      if (!referenceSource) {
        throw new Error('No image provided for face registration');
      }

      const filePath = this.saveBase64Image(referenceSource);

      await this.prisma.student.update({
        where: { id: student.id },
        data: { faceImage: filePath },
      });

      student.faceImage = filePath;
    }

    // =========================
    // ✅ LIVENESS FLOW
    // =========================
    if (frames && frames.length >= 3) {
      const framePaths = await Promise.all(
        frames.map(async (frame) => this.saveBase64Image(frame))
      );

      if (!student.faceImage) {
        throw new Error('Reference image is missing');
      }

      const referencePath = path.resolve(student.faceImage);

      const liveVerified = await this.verifyLiveness(
        framePaths,
        referencePath
      );

      if (!liveVerified) {
        throw new Error('Liveness check failed');
      }

      return this.prisma.attendance.create({
        data: {
          student: {
            connect: { id: studentId },
          },
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 2 * 60 * 60 * 1000),
          verified: true,

          // ✅ 🔥 REAL FIX HERE
          course: courseName || 'UNKNOWN',
          courseCode: courseCode || 'UNKNOWN',
          college: college || 'UNKNOWN',
          department: department || 'UNKNOWN',
        },
      });
    }

    // =========================
    // ✅ FACE MATCH FLOW
    // =========================
    if (faceImage) {
      const liveImagePath = this.saveBase64Image(faceImage);

      const verified = await this.compareFaces(
        student.faceImage!,
        liveImagePath,
      );

      if (!verified) {
        throw new Error('Face does not match');
      }

      return this.prisma.attendance.create({
        data: {
          student: {
            connect: { id: studentId },
          },
          checkIn: new Date(),
          verified: true,

          // ✅ 🔥 REAL FIX HERE TOO
          course: courseName || 'UNKNOWN',
          courseCode: courseCode || 'UNKNOWN',
          college: college || 'UNKNOWN',
          department: department || 'UNKNOWN',
        },
      });
    }

    throw new Error('Invalid check-in data');
  }

  async verifyLiveness(frames: string[], reference: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5001/liveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, reference }),
      });

      const data: any = await response.json();
      return data?.verified === true;
    } catch (error) {
      console.error('Liveness failed:', error);
      return false;
    }
  }

  async compareFaces(image1: string, image2: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5001/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image1, image2 }),
      });

      const data: any = await response.json();
      return data?.verified === true;
    } catch (error) {
      console.error('Face comparison failed:', error);
      return false;
    }
  }

  async registerFace(studentId: string, faceImage: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) throw new Error('Student not found');

    const filePath = this.saveBase64Image(faceImage);

    await this.prisma.student.update({
      where: { id: studentId },
      data: { faceImage: filePath },
    });

    return { message: 'Face registered successfully' };
  }

  async checkOut(studentId: string) {
    const record = await this.prisma.attendance.findFirst({
      where: { studentId, checkOut: null },
      orderBy: { checkIn: 'desc' },
    });

    if (!record) throw new Error('No active check-in');

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: new Date() },
    });
  }

  async getAll() {
    return this.prisma.attendance.findMany({
      include: { student: true },
      orderBy: { checkIn: 'desc' },
    });
  }

  async exportToExcel() {
    const records = await this.prisma.attendance.findMany({
      include: { student: true },
      orderBy: { checkIn: 'desc' },
    });

    const data = records.map((r: any) => ({
      Name: r.student?.name ?? '',
      MatricNo: r.student?.matricNo ?? '',
      Course: r.course ?? '',
      CheckIn: r.checkIn,
      CheckOut: r.checkOut,
      Verified: r.verified,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const filePath = 'attendance.xlsx';
    XLSX.writeFile(workbook, filePath);

    return filePath;
  }
}