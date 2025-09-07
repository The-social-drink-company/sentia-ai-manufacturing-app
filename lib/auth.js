import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth-config.js"

export { authOptions } from "./auth-config.js"

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}