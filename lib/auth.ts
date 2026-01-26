import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "./db/connect";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { ENV } from "./env";

// 1. Augment NextAuth types to handle custom fields like 'role'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
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

        // Industry Practice: Fetch the user and explicitly include password and role
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

        // Return the user object with the LATEST role from the database
        return { 
          id: user._id.toString(), 
          name: user.name, 
          email: user.email, 
          role: user.role, // This will be 'seller' if they registered a store
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
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              role: "user",
            });
          }
          return true;
        } catch (error) {
          console.error("Error saving google user:", error);
          return false;
        }
      }
      return true;
    },

    // 3. The JWT Callback - This handles the token stored in the browser cookie
    async jwt({ token, user, trigger, session }) {
      // Handle the 'update' trigger from the frontend (useSession().update())
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Initial login: user object is available only the first time
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      
      return token;
    },

    // 4. The Session Callback - This makes the data available to the frontend & getServerSession
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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