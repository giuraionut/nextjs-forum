import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST };
