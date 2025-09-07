import NextAuth from 'next-auth'
import { authOptions } from '../../lib/auth-config.js'

export default NextAuth(authOptions)