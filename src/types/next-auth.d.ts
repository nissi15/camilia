import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    locationId?: string | null;
    locationName?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      locationId: string | null;
      locationName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    locationId?: string | null;
    locationName?: string | null;
  }
}
