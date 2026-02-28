import 'dotenv/config';
import { db } from '../../lib/db';
import { auth } from '../../lib/auth';
import type { Database } from '../database/types';
import type { InsertObject } from 'kysely';
import { sql } from 'kysely';

const DEMO_USER = {
  email: 'demo@dance.academy',
  password: 'Demo1234!',
  name: 'Admin Demo',
};

const ACADEMY_NAME = 'Dance Academy Demo';

async function seed() {
  console.log('🌱 Starting seed...\n');

  try {
    console.log('1. Creating user...');
    let user: any;
    
    try {
      user = await auth.api.signUpEmail({
        body: {
          email: DEMO_USER.email,
          password: DEMO_USER.password,
          name: DEMO_USER.name,
        },
      });
      console.log('   User created:', user.user.email);
    } catch (e: any) {
      if (e.message?.includes('already registered') || e.message?.includes('already exists')) {
        console.log('   User already exists');
      } else {
        throw e;
      }
    }

    console.log('\n2. Getting user ID...');
    const userRecord = await sql<{ id: string }>`
      SELECT id FROM "user" WHERE email = ${DEMO_USER.email}
    `.execute(db);

    if (!userRecord.rows[0]) {
      throw new Error('User not found after creation');
    }

    const userId = userRecord.rows[0].id;

    console.log('\n3. Creating organization (academy)...');
    let org: any;
    
    const existingOrgResult = await sql<{ id: string; name: string; slug: string }>`
      SELECT id, name, slug FROM organization WHERE name = ${ACADEMY_NAME}
    `.execute(db);

    if (existingOrgResult.rows[0]) {
      org = { organization: existingOrgResult.rows[0] };
      console.log('   Organization already exists, using existing org...');
    } else {
      const orgId = crypto.randomUUID();
      await sql`
        INSERT INTO organization (id, name, slug, "createdAt")
        VALUES (${orgId}, ${ACADEMY_NAME}, 'dance-academy-demo', NOW())
      `.execute(db);

      await sql`
        INSERT INTO member (id, "userId", "organizationId", role, "createdAt")
        VALUES (${crypto.randomUUID()}, ${userId}, ${orgId}, 'owner', NOW())
      `.execute(db);

      org = { organization: { id: orgId, name: ACADEMY_NAME, slug: 'dance-academy-demo' } };
      console.log('   Organization created:', ACADEMY_NAME);
    }

    const organizationId = org.organization.id;
    console.log('   Organization ID:', organizationId);

    console.log('\n4. Creating instructors...');
    const instructors = [
      {
        organization_id: organizationId,
        name: 'María González',
        email: 'maria@dance.academy',
        phone: '+52 555-123-4567',
        specialization: 'Ballet y Contemporáneo',
        is_active: true,
      },
      {
        organization_id: organizationId,
        name: 'Carlos Ruiz',
        email: 'carlos@dance.academy',
        phone: '+52 555-234-5678',
        specialization: 'Hip Hop y urbano',
        is_active: true,
      },
    ];

    const insertedInstructors = await db
      .insertInto('instructor')
      .values(instructors)
      .returningAll()
      .execute();

    console.log('   Created', insertedInstructors.length, 'instructors');
    const [instructor1, instructor2] = insertedInstructors;

    console.log('\n4. Creating students...');
    const students = [
      { organization_id: organizationId, name: 'Ana López', email: 'ana@test.com', phone: '+52 555-111-1111' },
      { organization_id: organizationId, name: 'Pedro Sánchez', email: 'pedro@test.com', phone: '+52 555-222-2222' },
      { organization_id: organizationId, name: 'Laura Martínez', email: 'laura@test.com', phone: '+52 555-333-3333' },
      { organization_id: organizationId, name: 'Miguel Torres', email: 'miguel@test.com', phone: '+52 555-444-4444' },
      { organization_id: organizationId, name: 'Sofia Ramírez', email: 'sofia@test.com', phone: '+52 555-555-5555' },
      { organization_id: organizationId, name: 'Diego Flores', email: 'diego@test.com', phone: '+52 555-666-6666' },
      { organization_id: organizationId, name: 'Valentina Gómez', email: 'valentina@test.com', phone: '+52 555-777-7777' },
      { organization_id: organizationId, name: 'Javier Hernández', email: 'javier@test.com', phone: '+52 555-888-8888' },
      { organization_id: organizationId, name: 'Isabella Díaz', email: 'isabella@test.com', phone: '+52 555-999-9999' },
      { organization_id: organizationId, name: 'Alejandro Cruz', email: 'alejandro@test.com', phone: '+52 555-000-0000' },
      { organization_id: organizationId, name: 'Emma Rodríguez', email: 'emma@test.com', phone: '+52 555-121-2121' },
      { organization_id: organizationId, name: 'Lucas Morales', email: 'lucas@test.com', phone: '+52 555-131-3131' },
    ];

    const insertedStudents = await db
      .insertInto('student')
      .values(students)
      .returningAll()
      .execute();

    console.log('   Created', insertedStudents.length, 'students');
    console.log('   Affiliation numbers:', insertedStudents.map(s => s.affiliation_number).join(', '));

    console.log('\n5. Creating dance groups...');
    const groups = [
      {
        organization_id: organizationId,
        instructor_id: instructor1.id,
        name: 'Ballet Básico',
        description: 'Clase introductoria de ballet para principiantes',
        schedule_days: ['Monday', 'Wednesday', 'Friday'],
        start_time: '10:00',
        end_time: '11:30',
        capacity: 15,
        is_active: true,
      },
      {
        organization_id: organizationId,
        instructor_id: instructor2.id,
        name: 'Hip Hop Intermedio',
        description: 'Técnicas de Hip Hop para nivel intermedio',
        schedule_days: ['Tuesday', 'Thursday'],
        start_time: '18:00',
        end_time: '19:30',
        capacity: 12,
        is_active: true,
      },
      {
        organization_id: organizationId,
        instructor_id: instructor1.id,
        name: 'Salsa Beginners',
        description: 'Aprende los pasos básicos de salsa',
        schedule_days: ['Monday', 'Wednesday'],
        start_time: '17:00',
        end_time: '18:00',
        capacity: 20,
        is_active: true,
      },
      {
        organization_id: organizationId,
        instructor_id: instructor2.id,
        name: 'Contemporáneo Avanzado',
        description: 'Expresión corporal y técnicas contemporáneas avanzadas',
        schedule_days: ['Tuesday', 'Thursday', 'Saturday'],
        start_time: '11:00',
        end_time: '12:30',
        capacity: 10,
        is_active: true,
      },
    ];

    const insertedGroups = await db
      .insertInto('dance_group')
      .values(groups)
      .returningAll()
      .execute();

    console.log('   Created', insertedGroups.length, 'groups');
    const [group1, group2, group3, group4] = insertedGroups;

    console.log('\n6. Creating enrollments...');
    const enrollments = [
      { group_id: group1.id, student_id: insertedStudents[0].id, is_active: true },
      { group_id: group1.id, student_id: insertedStudents[1].id, is_active: true },
      { group_id: group1.id, student_id: insertedStudents[2].id, is_active: true },
      { group_id: group2.id, student_id: insertedStudents[3].id, is_active: true },
      { group_id: group2.id, student_id: insertedStudents[4].id, is_active: true },
      { group_id: group2.id, student_id: insertedStudents[5].id, is_active: true },
      { group_id: group3.id, student_id: insertedStudents[6].id, is_active: true },
      { group_id: group3.id, student_id: insertedStudents[7].id, is_active: true },
      { group_id: group4.id, student_id: insertedStudents[8].id, is_active: true },
      { group_id: group4.id, student_id: insertedStudents[9].id, is_active: true },
      { group_id: group4.id, student_id: insertedStudents[10].id, is_active: true },
      { group_id: group4.id, student_id: insertedStudents[11].id, is_active: true },
    ];

    const insertedEnrollments = await db
      .insertInto('enrollment')
      .values(enrollments)
      .returningAll()
      .execute();

    console.log('   Created', insertedEnrollments.length, 'enrollments');

    console.log('\n7. Creating memberships...');
    const today = new Date();
    const memberships: InsertObject<Database, 'membership'>[] = [
      { student_id: insertedStudents[0].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '800.00', status: 'active' },
      { student_id: insertedStudents[1].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '800.00', status: 'active' },
      { student_id: insertedStudents[2].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '800.00', status: 'active' },
      { student_id: insertedStudents[3].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '600.00', status: 'active' },
      { student_id: insertedStudents[4].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '600.00', status: 'active' },
      { student_id: insertedStudents[5].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '600.00', status: 'active' },
      { student_id: insertedStudents[6].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '500.00', status: 'active' },
      { student_id: insertedStudents[7].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '500.00', status: 'active' },
      { student_id: insertedStudents[8].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '900.00', status: 'active' },
      { student_id: insertedStudents[9].id, organization_id: organizationId, start_date: today, end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), amount: '900.00', status: 'active' },
    ];

    const insertedMemberships = await db
      .insertInto('membership')
      .values(memberships)
      .returningAll()
      .execute();

    console.log('   Created', insertedMemberships.length, 'memberships');

    console.log('\n8. Creating payments...');
    const payments: any[] = [
      { membership_id: insertedMemberships[0].id, student_id: insertedStudents[0].id, organization_id: organizationId, amount: '800.00', type: 'full' },
      { membership_id: insertedMemberships[1].id, student_id: insertedStudents[1].id, organization_id: organizationId, amount: '800.00', type: 'full' },
      { membership_id: insertedMemberships[2].id, student_id: insertedStudents[2].id, organization_id: organizationId, amount: '800.00', type: 'full' },
      { membership_id: insertedMemberships[3].id, student_id: insertedStudents[3].id, organization_id: organizationId, amount: '300.00', type: 'partial', notes: 'Primera cuota' },
      { membership_id: insertedMemberships[3].id, student_id: insertedStudents[3].id, organization_id: organizationId, amount: '300.00', type: 'partial', notes: 'Segunda cuota' },
      { membership_id: insertedMemberships[4].id, student_id: insertedStudents[4].id, organization_id: organizationId, amount: '600.00', type: 'full' },
      { membership_id: insertedMemberships[5].id, student_id: insertedStudents[5].id, organization_id: organizationId, amount: '600.00', type: 'full' },
      { membership_id: insertedMemberships[6].id, student_id: insertedStudents[6].id, organization_id: organizationId, amount: '500.00', type: 'full' },
      { membership_id: insertedMemberships[7].id, student_id: insertedStudents[7].id, organization_id: organizationId, amount: '500.00', type: 'full' },
      { membership_id: insertedMemberships[8].id, student_id: insertedStudents[8].id, organization_id: organizationId, amount: '900.00', type: 'full' },
    ];

    const insertedPayments = await db
      .insertInto('payment')
      .values(payments)
      .returningAll()
      .execute();

    console.log('   Created', insertedPayments.length, 'payments');

    console.log('\n9. Creating attendance records (last 7 days)...');
    const attendances: Array<{
      student_id: string;
      group_id: string;
      date: Date;
      type: 'qr' | 'number' | 'manual';
    }> = [];
    const attendanceTypes: Array<'qr' | 'number' | 'manual'> = ['qr', 'manual', 'number'];
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      for (const enrollment of insertedEnrollments) {
        if (Math.random() > 0.3) {
          attendances.push({
            student_id: enrollment.student_id,
            group_id: enrollment.group_id,
            date: date,
            type: attendanceTypes[Math.floor(Math.random() * attendanceTypes.length)],
          });
        }
      }
    }

    const insertedAttendances = await db
      .insertInto('attendance')
      .values(attendances)
      .returningAll()
      .execute();

    console.log('   Created', insertedAttendances.length, 'attendance records');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('========================================');
    console.log('Demo credentials:');
    console.log('  Email:', DEMO_USER.email);
    console.log('  Password:', DEMO_USER.password);
    console.log('  Academy:', ACADEMY_NAME);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
