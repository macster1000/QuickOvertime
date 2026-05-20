import { Role, RequestType, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import { db as prisma } from "../lib/db";

async function main() {
  console.log("Starting database seeding...");

  const employeeCount = await prisma.employee.count();
  if (employeeCount > 0) {
    console.log("Database already has employees. Skipping seeding.");
    return;
  }

  const pinHashAdmin = bcrypt.hashSync("1234", 10);
  const pinHashEmployee = bcrypt.hashSync("1111", 10);

  // Create Admin
  const admin = await prisma.employee.create({
    data: {
      name: "Praxisleitung",
      pinHash: pinHashAdmin,
      role: Role.ADMIN,
    },
  });
  console.log("Created admin account:", admin.name);

  // Create Employees
  const names = ["Schultz", "Huth", "Korn", "Hell", "Yousuf-Mahnke", "Dinkelacker", "Wiedenhofer"];
  const employees = [];

  for (const name of names) {
    const emp = await prisma.employee.create({
      data: {
        name,
        pinHash: pinHashEmployee,
        role: Role.EMPLOYEE,
      },
    });
    employees.push(emp);
    console.log(`Created employee account: ${name} (PIN: 1111)`);
  }

  // Create some realistic historical requests (last 30 days)
  const reasonsOvertime = [
    "Patientenüberhang am Abend wegen Notfällen",
    "Späte OP-Begleitung und Nachsorge",
    "Quartalsabrechnung vorbereiten",
    "Praxisteam-Meeting nach den Sprechzeiten",
    "Ausfall Kollegin kompensiert",
  ];

  const reasonsCompensation = [
    "Einen halben Tag früher gegangen",
    "Abfeiern Überstunden (Zahnarzttermin)",
    "Freizeitausgleich für OP-Begleitung letzte Woche",
  ];

  const reasonsVacation = [
    "Jahresurlaub",
    "Familienurlaub geplant",
    "Brückentag",
    "Kurzurlaub verlängertes Wochenende",
  ];

  const reasonsOvertimeReduction = [
    "Überstundenabbau - halber Tag frei",
    "Gleitzeit-Ausgleich",
    "Überstunden abbauen wegen Arzttermin",
  ];

  const statusOptions = [Status.APPROVED, Status.APPROVED, Status.APPROVED, Status.PENDING, Status.REJECTED];

  // Seed requests
  for (const emp of employees) {
    // Generate 4-6 requests for each
    const numRequests = Math.floor(Math.random() * 3) + 4;
    for (let i = 0; i < numRequests; i++) {
      const rand = Math.random();
      let type: RequestType;
      let hours: number;
      let reason: string;

      if (rand < 0.35) {
        type = RequestType.OVERTIME;
        hours = [0.5, 1.0, 1.5, 2.0, 2.5][Math.floor(Math.random() * 5)];
        reason = reasonsOvertime[Math.floor(Math.random() * reasonsOvertime.length)];
      } else if (rand < 0.55) {
        type = RequestType.COMPENSATION;
        hours = [1.0, 2.0, 3.5, 4.0][Math.floor(Math.random() * 4)];
        reason = reasonsCompensation[Math.floor(Math.random() * reasonsCompensation.length)];
      } else if (rand < 0.80) {
        type = RequestType.VACATION;
        hours = [8.0, 16.0, 24.0, 40.0][Math.floor(Math.random() * 4)]; // 1-5 Tage
        reason = reasonsVacation[Math.floor(Math.random() * reasonsVacation.length)];
      } else {
        type = RequestType.OVERTIME_REDUCTION;
        hours = [2.0, 4.0, 6.0, 8.0][Math.floor(Math.random() * 4)];
        reason = reasonsOvertimeReduction[Math.floor(Math.random() * reasonsOvertimeReduction.length)];
      }

      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30) - 1);

      let adminComment = null;
      if (status === Status.REJECTED) {
        adminComment = "Wurde bereits am Vortag ausgeglichen / nicht abgesprochen.";
      }

      await prisma.request.create({
        data: {
          employeeId: emp.id,
          type,
          hours,
          reason,
          status,
          date,
          adminComment,
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
