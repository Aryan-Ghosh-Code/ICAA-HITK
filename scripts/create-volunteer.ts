// Create or reset a volunteer login with a strong password.
// Usage:
//   npx tsx scripts/create-volunteer.ts "<name>" "<password, min 8 chars>" [volunteer|admin]
// Example:
//   npx tsx scripts/create-volunteer.ts "rahul" "SuperSecretPass2027!"
//   npx tsx scripts/create-volunteer.ts "desk-admin" "IcaaAdmin#2027Secure" admin

import { db, type VolunteerDoc } from "../lib/db";
import { hashPassword } from "../lib/pin";
import { newId } from "../lib/ids";

async function main() {
  const [name, password, role = "volunteer"] = process.argv.slice(2);
  if (!name || !password || !["volunteer", "admin"].includes(role)) {
    console.error(
      'usage: npx tsx scripts/create-volunteer.ts "<name>" "<strong-password, min 8 chars>" [volunteer|admin]',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters long for security.");
    process.exit(1);
  }

  const d = await db();
  const vols = d.collection<VolunteerDoc>("volunteers");
  await vols.createIndex({ name: 1 }, { unique: true });

  const normName = name.toLowerCase().trim();
  const hashedPassword = hashPassword(password);

  await vols.updateOne(
    { name: normName },
    {
      $set: {
        passwordHash: hashedPassword,
        role: role as VolunteerDoc["role"],
        active: true,
      },
      $setOnInsert: { _id: newId() },
    },
    { upsert: true },
  );

  console.log(`\nVolunteer account successfully created!`);
  console.log(`  Volunteer Name: ${normName}`);
  console.log(`  Role:           ${role}`);
  console.log(`  Password:       [Securely hashed with bcrypt]`);
  console.log(
    `\nThey can now sign in at the scanner app with this username and password.`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
