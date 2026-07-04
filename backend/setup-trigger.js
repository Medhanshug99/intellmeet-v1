const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Creating trigger function...');
  
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public."User" (id, email, name, role, "updatedAt")
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          'Member',
          NOW()
        );
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('Function created successfully.');

    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    console.log('Trigger created successfully on auth.users!');
  } catch (err) {
    console.error('Error creating trigger:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
