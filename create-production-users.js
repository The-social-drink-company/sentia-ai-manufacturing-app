#!/usr/bin/env node

/**
 * Create Production Users Script
 * Adds all demo and real users to production database
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const users = [
  {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@demo.com',
    password: 'demo',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@sentiaspirits.com',
    password: 'demo123',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Production',
    lastName: 'Manager',
    email: 'manager@sentiaspirits.com',
    password: 'demo123',
    role: 'manager',
    isActive: true,
  },
  {
    firstName: 'Floor',
    lastName: 'Operator',
    email: 'operator@sentiaspirits.com',
    password: 'demo123',
    role: 'operator',
    isActive: true,
  },
  {
    firstName: 'Paul',
    lastName: 'Roberts',
    email: 'paul.roberts@sentiaspirits.com',
    password: 'sentia2025',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Daniel',
    lastName: 'Kenny',
    email: 'daniel.kenny@sentiaspirits.com',
    password: 'sentia2025',
    role: 'manager',
    isActive: true,
  },
  {
    firstName: 'David',
    lastName: 'Orren',
    email: 'david.orren@gabalabs.com',
    password: 'gaba2025',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Admin',
    lastName: 'Portal',
    email: 'admin@app.sentiaspirits.com',
    password: 'admin2025',
    role: 'admin',
    isActive: true,
  },
  {
    firstName: 'Data',
    lastName: 'Upload',
    email: 'data@app.sentiaspirits.com',
    password: 'data2025',
    role: 'operator',
    isActive: true,
  },
]

async function createUsers() {
  console.log('Creating production users...')

  for (const userData of users) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Create or update user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: hashedPassword,
          role: userData.role,
          isActive: userData.isActive,
        },
        create: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          isActive: userData.isActive,
        },
      })

      console.log(`✅ Created/Updated: ${user.email} (${user.role})`)
    } catch (error) {
      console.error(`❌ Failed to create ${userData.email}:`, error.message)
    }
  }

  console.log('\n🎉 Production users setup complete!')
  console.log('All users can now login to: https://sentiaprod.financeflo.ai')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
}

export { users, createUsers }
