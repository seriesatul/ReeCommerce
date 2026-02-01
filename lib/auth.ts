import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "./db/connect";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

// 1. Augment NextAuth types to handle custom fields like 'role' and 'onboarding'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
    onboardingCompleted?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        await connectDB();

        // Industry Practice: Fetch user and explicitly include password and onboarding status
        const user = await User.findOne({ email: credentials.email }).select("+password");
        
        if (!user) {
          throw new Error("No user found with this email");
        }

        if (user.provider !== "credentials") {
          throw new Error(`Please login using ${user.provider}`);
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password!);
        
        if (!isMatch) {
          throw new Error("Invalid password");
        }

        // IMPORTANT: Return everything needed for the first JWT creation
        return { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          onboardingCompleted: user.onboardingCompleted,
          image: user.image 
        };
      },
    }),
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              role: "user",
              onboardingCompleted: false, // Explicitly set for new Google users
            });
            // Update user object for the callback
            user.id = newUser._id.toString();
            user.role = newUser.role;
            user.onboardingCompleted = newUser.onboardingCompleted;
          } else {
            // Existing Google user: update callback object with DB data
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            user.onboardingCompleted = existingUser.onboardingCompleted;
          }
          return true;
        } catch (error) {
          console.error("Error saving google user:", error);
          return false;
        }
      }
      return true;
    },

    // 3. The JWT Callback - The engine of session persistence
    async jwt({ token, user, trigger, session }) {
      // HANDLE UPDATES: When useSession().update() is called on the frontend
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted;
        }
      }

      // INITIAL LOGIN: Transfer data from User object to Token
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.onboardingCompleted = user.onboardingCompleted;
      }
      
      return token;
    },

    // 4. The Session Callback - Makes data available to components & middleware
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: ENV.NEXTAUTH_SECRET, 
};