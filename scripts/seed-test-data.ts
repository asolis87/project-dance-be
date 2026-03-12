/**
 * Script para generar datos de prueba para la organización de testing.
 *
 * Uso: npx tsx scripts/seed-test-data.ts
 *
 * Cubre los siguientes escenarios:
 *
 * MEMBRESÍAS:
 *   - Activa, al día (con pago completo)
 *   - Activa, con pago parcial (saldo pendiente)
 *   - Activa, vence en 7 días (trigger de recordatorio)
 *   - Activa, vence en 3 días (trigger de recordatorio)
 *   - Activa, vence mañana
 *   - Activa, sin ningún pago registrado (moroso total)
 *   - Expirada, sin renovar
 *   - Expirada, con recordatorio enviado
 *   - Cancelada manualmente
 *
 * GRUPOS / INSCRIPCIONES / ASISTENCIA:
 *   - 3 grupos con distinto horario y capacidad
 *   - Alumnos con asistencia regular, irregular y sin asistencia
 *
 * REPORTES:
 *   - Pagos distribuidos en los últimos 3 meses para gráficas de ingresos
 *   - Mix de pagos full y partial para probar breakdown por tipo
 */

import 'dotenv/config';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

const ORG_ID = 'F66pMNHqOUl3SM0Ko3fDWCcJMD5evEw7';

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nGenerando datos de prueba para org: ${ORG_ID}\n`);

  // -------------------------------------------------------------------------
  // 1. Instructores
  // -------------------------------------------------------------------------
  console.log('1. Insertando instructores...');

  const instructors = await db
    .insertInto('instructor')
    .values([
      {
        organization_id: ORG_ID,
        name: 'Valentina Ríos',
        email: 'valentina.rios@test.com',
        phone: '1155551001',
        specialization: 'Salsa y Bachata',
        is_active: true,
      },
      {
        organization_id: ORG_ID,
        name: 'Marcos Gutiérrez',
        email: 'marcos.gutierrez@test.com',
        phone: '1155551002',
        specialization: 'Tango',
        is_active: true,
      },
      {
        organization_id: ORG_ID,
        name: 'Sofía Beltrán',
        email: 'sofia.beltran@test.com',
        phone: '1155551003',
        specialization: 'Folklore',
        is_active: false, // inactiva para probar filtros
      },
    ])
    .returning(['id', 'name'])
    .execute();

  const [instrValentina, instrMarcos] = instructors;
  console.log(`   ✓ ${instructors.length} instructores`);

  // -------------------------------------------------------------------------
  // 2. Grupos
  // -------------------------------------------------------------------------
  console.log('2. Insertando grupos...');

  const groups = await db
    .insertInto('dance_group')
    .values([
      {
        organization_id: ORG_ID,
        instructor_id: instrValentina.id,
        name: 'Salsa Nivel Inicial',
        description: 'Grupo para principiantes en salsa',
        schedule_days: ['mon', 'wed', 'fri'],
        start_time: '19:00',
        end_time: '20:30',
        capacity: 20,
        is_active: true,
      },
      {
        organization_id: ORG_ID,
        instructor_id: instrMarcos.id,
        name: 'Tango Avanzado',
        description: 'Grupo avanzado de tango',
        schedule_days: ['tue', 'thu'],
        start_time: '20:00',
        end_time: '21:30',
        capacity: 15,
        is_active: true,
      },
      {
        organization_id: ORG_ID,
        instructor_id: instrValentina.id,
        name: 'Bachata Intermedia',
        description: 'Nivel intermedio de bachata',
        schedule_days: ['sat'],
        start_time: '10:00',
        end_time: '12:00',
        capacity: 12,
        is_active: true,
      },
    ])
    .returning(['id', 'name'])
    .execute();

  const [groupSalsa, groupTango, groupBachata] = groups;
  console.log(`   ✓ ${groups.length} grupos`);

  // -------------------------------------------------------------------------
  // 3. Alumnos
  // -------------------------------------------------------------------------
  console.log('3. Insertando alumnos...');

  const students = await db
    .insertInto('student')
    .values([
      // Alumnos con membresía activa al día
      { organization_id: ORG_ID, name: 'Lucía Fernández',   email: 'lucia.fernandez@test.com',   phone: '1155552001', is_active: true },
      { organization_id: ORG_ID, name: 'Tomás Pereyra',     email: 'tomas.pereyra@test.com',     phone: '1155552002', is_active: true },
      { organization_id: ORG_ID, name: 'Camila Morales',    email: 'camila.morales@test.com',    phone: '1155552003', is_active: true },
      // Alumnos con membresía próxima a vencer
      { organization_id: ORG_ID, name: 'Nicolás Herrera',   email: 'nicolas.herrera@test.com',   phone: '1155552004', is_active: true },
      { organization_id: ORG_ID, name: 'Martina López',     email: 'martina.lopez@test.com',     phone: '1155552005', is_active: true },
      { organization_id: ORG_ID, name: 'Agustín Romero',    email: 'agustin.romero@test.com',    phone: '1155552006', is_active: true },
      // Alumno con pago parcial (saldo pendiente)
      { organization_id: ORG_ID, name: 'Florencia Castro',  email: 'florencia.castro@test.com',  phone: '1155552007', is_active: true },
      // Alumno moroso total (sin pago)
      { organization_id: ORG_ID, name: 'Rodrigo Vega',      email: 'rodrigo.vega@test.com',      phone: '1155552008', is_active: true },
      // Alumnos con membresía expirada
      { organization_id: ORG_ID, name: 'Julieta Sánchez',   email: 'julieta.sanchez@test.com',   phone: '1155552009', is_active: true },
      { organization_id: ORG_ID, name: 'Diego Ramírez',     email: 'diego.ramirez@test.com',     phone: '1155552010', is_active: true },
      // Alumno con membresía cancelada
      { organization_id: ORG_ID, name: 'Paula Medina',      email: 'paula.medina@test.com',      phone: '1155552011', is_active: false },
      // Alumnos extra para tango y bachata
      { organization_id: ORG_ID, name: 'Emilio Torres',     email: 'emilio.torres@test.com',     phone: '1155552012', is_active: true },
      { organization_id: ORG_ID, name: 'Renata Ibáñez',     email: 'renata.ibanez@test.com',     phone: '1155552013', is_active: true },
      { organization_id: ORG_ID, name: 'Gabriel Suárez',    email: 'gabriel.suarez@test.com',    phone: '1155552014', is_active: true },
    ])
    .returning(['id', 'name'])
    .execute();

  const [
    stuLucia, stuTomas, stuCamila,       // activos al día
    stuNicolas, stuMartina, stuAgustin,  // próximos a vencer
    stuFlorencia,                         // pago parcial
    stuRodrigo,                           // moroso
    stuJulieta, stuDiego,                 // expirados
    stuPaula,                             // cancelado
    stuEmilio, stuRenata, stuGabriel,     // tango / bachata
  ] = students;

  console.log(`   ✓ ${students.length} alumnos`);

  // -------------------------------------------------------------------------
  // 4. Inscripciones
  // -------------------------------------------------------------------------
  console.log('4. Insertando inscripciones...');

  await db
    .insertInto('enrollment')
    .values([
      // Salsa: alumnos activos
      { group_id: groupSalsa.id, student_id: stuLucia.id,     is_active: true },
      { group_id: groupSalsa.id, student_id: stuTomas.id,     is_active: true },
      { group_id: groupSalsa.id, student_id: stuCamila.id,    is_active: true },
      { group_id: groupSalsa.id, student_id: stuNicolas.id,   is_active: true },
      { group_id: groupSalsa.id, student_id: stuMartina.id,   is_active: true },
      { group_id: groupSalsa.id, student_id: stuFlorencia.id, is_active: true },
      { group_id: groupSalsa.id, student_id: stuRodrigo.id,   is_active: true },
      { group_id: groupSalsa.id, student_id: stuJulieta.id,   is_active: false }, // desinscripta
      // Tango
      { group_id: groupTango.id, student_id: stuEmilio.id,    is_active: true },
      { group_id: groupTango.id, student_id: stuRenata.id,    is_active: true },
      { group_id: groupTango.id, student_id: stuAgustin.id,   is_active: true },
      { group_id: groupTango.id, student_id: stuDiego.id,     is_active: true },
      // Bachata
      { group_id: groupBachata.id, student_id: stuGabriel.id, is_active: true },
      { group_id: groupBachata.id, student_id: stuLucia.id,   is_active: true }, // en 2 grupos
      { group_id: groupBachata.id, student_id: stuRenata.id,  is_active: true },
    ])
    .execute();

  console.log('   ✓ inscripciones');

  // -------------------------------------------------------------------------
  // 5. Membresías
  // -------------------------------------------------------------------------
  console.log('5. Insertando membresías...');

  const memAmount = '5000.00';

  // --- 5a. ACTIVAS, AL DÍA ---
  const [memLucia, memTomas, memCamila] = await db
    .insertInto('membership')
    .values([
      {
        student_id: stuLucia.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(20)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
      {
        student_id: stuTomas.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(15)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
      {
        student_id: stuCamila.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(25)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5b. PRÓXIMAS A VENCER ---
  const [memNicolas, memMartina, memAgustin] = await db
    .insertInto('membership')
    .values([
      {
        // vence en exactamente 7 días → trigger '7_days_before'
        student_id: stuNicolas.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(7)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
      {
        // vence en 3 días → trigger '3_days_before'
        student_id: stuMartina.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(3)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
      {
        // vence mañana → borde crítico
        student_id: stuAgustin.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(1)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5c. PAGO PARCIAL (saldo pendiente) ---
  const [memFlorencia] = await db
    .insertInto('membership')
    .values([
      {
        student_id: stuFlorencia.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(18)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5d. MOROSO TOTAL (sin pagos) ---
  const [memRodrigo] = await db
    .insertInto('membership')
    .values([
      {
        student_id: stuRodrigo.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(10)),
        amount: memAmount,
        status: 'active',
        created_at: monthsAgo(1),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5e. EXPIRADAS ---
  const [memJulieta, memDiego] = await db
    .insertInto('membership')
    .values([
      {
        // expirada sin renovar (venció hace 10 días)
        student_id: stuJulieta.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(2)),
        end_date: toDateStr(daysFromNow(-10)),
        amount: memAmount,
        status: 'expired',
        created_at: monthsAgo(2),
      },
      {
        // expirada hace 1 mes con recordatorio enviado
        student_id: stuDiego.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(3)),
        end_date: toDateStr(monthsAgo(2)),
        amount: memAmount,
        status: 'expired',
        created_at: monthsAgo(3),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5f. CANCELADA ---
  const [memPaula] = await db
    .insertInto('membership')
    .values([
      {
        student_id: stuPaula.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(2)),
        end_date: toDateStr(monthsAgo(1)),
        amount: memAmount,
        status: 'cancelled',
        created_at: monthsAgo(2),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  // --- 5g. Membresías de meses anteriores (para reportes de ingresos) ---
  const [memEmilio1, memEmilio2, memRenata1, memGabriel1] = await db
    .insertInto('membership')
    .values([
      {
        student_id: stuEmilio.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(3)),
        end_date: toDateStr(monthsAgo(2)),
        amount: memAmount,
        status: 'expired',
        created_at: monthsAgo(3),
      },
      {
        student_id: stuEmilio.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(2)),
        end_date: toDateStr(monthsAgo(1)),
        amount: memAmount,
        status: 'expired',
        created_at: monthsAgo(2),
      },
      {
        student_id: stuRenata.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(2)),
        end_date: toDateStr(daysFromNow(5)),
        amount: '6500.00',
        status: 'active',
        created_at: monthsAgo(2),
      },
      {
        student_id: stuGabriel.id,
        organization_id: ORG_ID,
        start_date: toDateStr(monthsAgo(1)),
        end_date: toDateStr(daysFromNow(22)),
        amount: '6500.00',
        status: 'active',
        created_at: monthsAgo(1),
      },
    ])
    .returning(['id', 'student_id'])
    .execute();

  console.log('   ✓ membresías');

  // -------------------------------------------------------------------------
  // 6. Pagos
  // -------------------------------------------------------------------------
  console.log('6. Insertando pagos...');

  await db
    .insertInto('payment')
    .values([
      // Pagos completos — alumnos al día
      {
        membership_id: memLucia.id,
        student_id: stuLucia.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: 'Pago mensual completo',
      },
      {
        membership_id: memTomas.id,
        student_id: stuTomas.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: null,
      },
      {
        membership_id: memCamila.id,
        student_id: stuCamila.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: null,
      },
      // Pagos completos — próximos a vencer (pagaron, simplemente vence pronto)
      {
        membership_id: memNicolas.id,
        student_id: stuNicolas.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: null,
      },
      {
        membership_id: memMartina.id,
        student_id: stuMartina.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: null,
      },
      {
        membership_id: memAgustin.id,
        student_id: stuAgustin.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(1),
        notes: null,
      },
      // Pago parcial — Florencia pagó la mitad
      {
        membership_id: memFlorencia.id,
        student_id: stuFlorencia.id,
        organization_id: ORG_ID,
        amount: '2500.00',
        type: 'partial',
        paid_at: monthsAgo(1),
        notes: 'Abono parcial, saldo pendiente $2500',
      },
      // Rodrigo: sin pagos (moroso total) — no se inserta nada

      // Julieta: expirada, pagó en su momento
      {
        membership_id: memJulieta.id,
        student_id: stuJulieta.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(2),
        notes: null,
      },
      // Diego: expirada, pagó hace 3 meses
      {
        membership_id: memDiego.id,
        student_id: stuDiego.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(3),
        notes: null,
      },
      // Paula: cancelada, pagó en su momento
      {
        membership_id: memPaula.id,
        student_id: stuPaula.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(2),
        notes: 'Canceló a los 15 días',
      },
      // Historial de pagos para reportes de ingresos (meses anteriores)
      {
        membership_id: memEmilio1.id,
        student_id: stuEmilio.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(3),
        notes: null,
      },
      {
        membership_id: memEmilio2.id,
        student_id: stuEmilio.id,
        organization_id: ORG_ID,
        amount: '5000.00',
        type: 'full',
        paid_at: monthsAgo(2),
        notes: null,
      },
      {
        membership_id: memRenata1.id,
        student_id: stuRenata.id,
        organization_id: ORG_ID,
        amount: '6500.00',
        type: 'full',
        paid_at: monthsAgo(2),
        notes: null,
      },
      {
        membership_id: memGabriel1.id,
        student_id: stuGabriel.id,
        organization_id: ORG_ID,
        amount: '3500.00',
        type: 'partial',
        paid_at: monthsAgo(1),
        notes: 'Primer cuota',
      },
      {
        membership_id: memGabriel1.id,
        student_id: stuGabriel.id,
        organization_id: ORG_ID,
        amount: '3000.00',
        type: 'partial',
        paid_at: daysFromNow(-5),
        notes: 'Segunda cuota',
      },
    ])
    .execute();

  console.log('   ✓ pagos');

  // -------------------------------------------------------------------------
  // 7. Recordatorios de pago
  // -------------------------------------------------------------------------
  console.log('7. Insertando recordatorios...');

  await db
    .insertInto('payment_reminder')
    .values([
      // Diego: expirada hace más de un mes → recordatorio 'expired' ya enviado
      {
        membership_id: memDiego.id,
        reminder_type: 'expired',
        sent_at: monthsAgo(2),
      },
      // Nicolás: vence en 7 días → recordatorio '7_days_before' ya enviado
      // (simula que el cron ya corrió hoy)
      {
        membership_id: memNicolas.id,
        reminder_type: '7_days_before',
        sent_at: new Date(),
      },
    ])
    .execute();

  console.log('   ✓ recordatorios');

  // -------------------------------------------------------------------------
  // 8. Asistencias
  // -------------------------------------------------------------------------
  console.log('8. Insertando asistencias...');

  // Genera asistencias para los últimos N días en un grupo dado
  type AttendanceEntry = {
    student_id: string;
    group_id: string;
    date: string;
    type: 'qr' | 'number' | 'manual';
  };

  const attendanceRows: AttendanceEntry[] = [];

  // Lucía: asistencia muy regular (lun/mie/vie últimas 6 semanas) → salsa
  for (let week = 0; week < 6; week++) {
    for (const offset of [1, 3, 5]) { // lun=1, mie=3, vie=5 días atrás en la semana
      const d = daysFromNow(-(week * 7 + offset));
      attendanceRows.push({ student_id: stuLucia.id, group_id: groupSalsa.id, date: toDateStr(d), type: 'qr' });
    }
  }

  // Tomás: asistencia regular (lun/mie) pero falta los viernes
  for (let week = 0; week < 6; week++) {
    for (const offset of [1, 3]) {
      const d = daysFromNow(-(week * 7 + offset));
      attendanceRows.push({ student_id: stuTomas.id, group_id: groupSalsa.id, date: toDateStr(d), type: 'number' });
    }
  }

  // Camila: asistencia irregular (últimas 2 semanas nomás)
  for (let week = 0; week < 2; week++) {
    const d = daysFromNow(-(week * 7 + 1));
    attendanceRows.push({ student_id: stuCamila.id, group_id: groupSalsa.id, date: toDateStr(d), type: 'manual' });
  }

  // Florencia: asistencia normal en salsa
  for (let week = 0; week < 4; week++) {
    for (const offset of [1, 3]) {
      const d = daysFromNow(-(week * 7 + offset));
      attendanceRows.push({ student_id: stuFlorencia.id, group_id: groupSalsa.id, date: toDateStr(d), type: 'qr' });
    }
  }

  // Rodrigo: sin asistencia (moroso y nunca fue)

  // Emilio: tango, asistencia regular
  for (let week = 0; week < 5; week++) {
    for (const offset of [2, 4]) { // mar=2, jue=4
      const d = daysFromNow(-(week * 7 + offset));
      attendanceRows.push({ student_id: stuEmilio.id, group_id: groupTango.id, date: toDateStr(d), type: 'qr' });
    }
  }

  // Renata: tango + bachata, muy activa
  for (let week = 0; week < 6; week++) {
    for (const offset of [2, 4]) {
      const d = daysFromNow(-(week * 7 + offset));
      attendanceRows.push({ student_id: stuRenata.id, group_id: groupTango.id, date: toDateStr(d), type: 'qr' });
    }
    const dSat = daysFromNow(-(week * 7 + 6));
    attendanceRows.push({ student_id: stuRenata.id, group_id: groupBachata.id, date: toDateStr(dSat), type: 'qr' });
  }

  // Gabriel: bachata, asistencia moderada
  for (let week = 0; week < 3; week++) {
    const d = daysFromNow(-(week * 7 + 6));
    attendanceRows.push({ student_id: stuGabriel.id, group_id: groupBachata.id, date: toDateStr(d), type: 'number' });
  }

  // Lucía también va a bachata
  for (let week = 0; week < 4; week++) {
    const d = daysFromNow(-(week * 7 + 6));
    attendanceRows.push({ student_id: stuLucia.id, group_id: groupBachata.id, date: toDateStr(d), type: 'qr' });
  }

  await db.insertInto('attendance').values(attendanceRows).execute();

  console.log(`   ✓ ${attendanceRows.length} registros de asistencia`);

  // -------------------------------------------------------------------------
  // Resumen
  // -------------------------------------------------------------------------
  console.log('\n✓ Datos de prueba generados exitosamente.\n');
  console.log('Resumen de escenarios cubiertos:');
  console.log('');
  console.log('  MEMBRESÍAS');
  console.log('  ├── Activa, pago completo          → Lucía, Tomás, Camila');
  console.log('  ├── Activa, vence en 7 días        → Nicolás (recordatorio enviado)');
  console.log('  ├── Activa, vence en 3 días        → Martina');
  console.log('  ├── Activa, vence mañana           → Agustín');
  console.log('  ├── Activa, pago parcial pendiente → Florencia ($2500 de $5000)');
  console.log('  ├── Activa, sin ningún pago        → Rodrigo');
  console.log('  ├── Expirada, sin renovar          → Julieta');
  console.log('  ├── Expirada, con reminder enviado → Diego');
  console.log('  └── Cancelada                      → Paula');
  console.log('');
  console.log('  ASISTENCIA');
  console.log('  ├── Regular (3 veces/semana)       → Lucía, Renata');
  console.log('  ├── Moderada (2 veces/semana)      → Tomás, Emilio');
  console.log('  ├── Irregular (últimas 2 semanas)  → Camila, Gabriel');
  console.log('  └── Sin asistencia                 → Rodrigo');
  console.log('');
  console.log('  REPORTES');
  console.log('  ├── Pagos distribuidos en 3 meses  → Emilio, Renata, Diego');
  console.log('  ├── Pagos parciales en 2 cuotas    → Gabriel');
  console.log('  └── Mix full/partial                → ver tabla payment');

  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('\nError generando datos de prueba:', err.message || err);
  process.exit(1);
});
