/**
 * Creates a user account directly in the database. There is no signup
 * endpoint - this is the only way to create the first Admin account before
 * anyone can log in to the Admin Panel's User Management page (every
 * account after that should be created there instead).
 *
 * Usage:
 *   npm run user:create -- <email> <password> <ADMIN|ENGINEER>
 */
import { authService } from '../src/services/auth.service.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { prisma } from '../src/prisma/client.js';

async function main() {
  const [email, password, role] = process.argv.slice(2);

  if (!email || !password || !role) {
    console.error('Usage: npm run user:create -- <email> <password> <ADMIN|ENGINEER>');
    process.exit(1);
  }
  if (role !== 'ADMIN' && role !== 'ENGINEER') {
    console.error(`Invalid role "${role}" - must be ADMIN or ENGINEER`);
    process.exit(1);
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    console.error(`A user with email ${email} already exists`);
    process.exit(1);
  }

  const passwordHash = await authService.hashPassword(password);
  const user = await userRepository.create({ email, password, role, passwordHash });
  console.log(`Created ${user.role} user: ${user.email} (${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
