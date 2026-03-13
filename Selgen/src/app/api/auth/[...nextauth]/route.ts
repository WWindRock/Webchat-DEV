import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import crypto from "crypto"
import Database from 'better-sqlite3'
import path from 'path'

const sqlite = new Database(path.join(process.cwd(), 'selgen.db'))

function hashPassword(password: string, salt: string): string {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash
}

function verifyPassword(password: string, storedPassword: string): boolean {
  const parts = storedPassword.split(':')
  if (parts.length !== 2) return false
  const [salt, hash] = parts
  const newHash = hashPassword(password, salt)
  return newHash === hash
}

async function verifyCredential(email: string, password: string) {
  try {
    const user = sqlite.prepare(`
      SELECT * FROM users WHERE email = ?
    `).get(email) as any
    
    if (!user) return null
    
    const account = sqlite.prepare(`
      SELECT * FROM accounts WHERE user_id = ? AND provider = 'credentials'
    `).get(user.id) as any
    
    if (!account || !account.password) return null
    
    const isValid = verifyPassword(password, account.password)
    if (!isValid) return null
    
    return user
  } catch (error) {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const user = await verifyCredential(
          credentials.email as string,
          credentials.password as string
        )
        
        if (!user) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // 开发环境不使用 https
      },
    },
  },
})

export const GET = handlers.GET
export const POST = handlers.POST
