@echo off
echo Seeding test users for SimTrace...
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Running seed script...
call npx tsx scripts/seed-users.ts

echo.
echo User seeding completed!
echo.
echo Test users created:
echo - admin@simtrace.site / Admin@123 (Admin)
echo - user@simtrace.site / User@123 (Regular User)
echo - police@simtrace.site / Police@123 (Police Officer)
echo - telecom@simtrace.site / Telecom@123 (Telecom Admin)
echo.
pause
