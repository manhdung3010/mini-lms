import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  await prisma.classRegistration.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.class.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();

  const parent1 = await prisma.parent.create({
    data: {
      name: "Nguyễn Văn An",
      phone: "0901234567",
      email: "an.nguyen@email.com",
    },
  });

  const parent2 = await prisma.parent.create({
    data: {
      name: "Trần Thị Bình",
      phone: "0912345678",
      email: "binh.tran@email.com",
    },
  });

  const student1 = await prisma.student.create({
    data: {
      name: "Nguyễn Minh Khoa",
      dob: new Date("2015-03-15"),
      gender: "MALE",
      currentGrade: "5",
      parentId: parent1.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: "Nguyễn Thị Lan",
      dob: new Date("2017-08-22"),
      gender: "FEMALE",
      currentGrade: "3",
      parentId: parent1.id,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      name: "Trần Đức Hùng",
      dob: new Date("2016-01-10"),
      gender: "MALE",
      currentGrade: "4",
      parentId: parent2.id,
    },
  });

  await prisma.class.create({
    data: {
      name: "Toán Nâng Cao",
      subject: "Toán",
      dayOfWeek: "MONDAY",
      timeSlotStart: "08:00",
      timeSlotEnd: "09:30",
      teacherName: "Thầy Tuấn",
      maxStudents: 20,
    },
  });

  await prisma.class.create({
    data: {
      name: "Tiếng Anh Giao Tiếp",
      subject: "Tiếng Anh",
      dayOfWeek: "WEDNESDAY",
      timeSlotStart: "08:00",
      timeSlotEnd: "09:30",
      teacherName: "Cô Hoa",
      maxStudents: 15,
    },
  });

  await prisma.class.create({
    data: {
      name: "Khoa Học Tự Nhiên",
      subject: "Khoa Học",
      dayOfWeek: "MONDAY",
      timeSlotStart: "10:00",
      timeSlotEnd: "11:30",
      teacherName: "Cô Mai",
      maxStudents: 15,
    },
  });

  await prisma.subscription.create({
    data: {
      studentId: student1.id,
      packageName: "Gói Học Kỳ 1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      totalSessions: 40,
      usedSessions: 5,
    },
  });

  await prisma.subscription.create({
    data: {
      studentId: student3.id,
      packageName: "Gói 3 Tháng",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-04-30"),
      totalSessions: 24,
      usedSessions: 2,
    },
  });

  console.log("Seed completed!");
  console.log(`  Parents: ${parent1.name}, ${parent2.name}`);
  console.log(
    `  Students: ${student1.name}, ${student2.name}, ${student3.name}`
  );
  console.log("  Classes: 3 classes created");
  console.log("  Subscriptions: 2 subscriptions created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
