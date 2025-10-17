import { findUserByEmail, updateUserPassword } from './lib/user-service.js'

async function fixDudleyPassword() {
  try {
    console.log('Finding user dudley@financeflo.ai...')
    const user = await findUserByEmail('dudley@financeflo.ai')

    if (user) {
      console.log(`Found user: ${user.email} (ID: ${user.id})`)

      console.log('Updating password to "dudley123"...')
      const success = await updateUserPassword(user.id, 'dudley123')

      if (success) {
        console.log('✅ Password updated successfully!')
        console.log('You can now log in with: dudley@financeflo.ai / dudley123')
      } else {
        console.log('❌ Failed to update password')
      }
    } else {
      console.log('❌ User not found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    process.exit(0)
  }
}

fixDudleyPassword()
