import NextAuth, { type NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        await connectDB()
        const user = await User.findOne({ email: credentials.email })

        if (!user) return null

        // Passwords are optional for OAuth users, but required for Credentials login
        if (!user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user._id.toString(), email: user.email, name: user.name || null }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          const existingUser = await User.findOne({ email: user.email })

          if (!existingUser) {
            // Create new user if they don't exist
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              // No password for OAuth users
            })
          }
          return true
        } catch (error) {
          console.error('Error in Google signIn callback:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // If it's the initial sign in, we might not have the DB ID in the user object yet (for Google auth)
        // logic above creates the user, but `user` object here comes from provider
        // We need to fetch the DB user to get the ID
        if (account?.provider === 'google') {
          await connectDB()
          const dbUser = await User.findOne({ email: user.email })
          if (dbUser) {
            token.userId = dbUser._id.toString()
          }
        } else {
          token.userId = (user as any).id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.userId) {
        (session as any).user.id = token.userId
      }
      return session
    }
  }
}

export async function getSession() {
  return getServerSession(authOptions)
}
