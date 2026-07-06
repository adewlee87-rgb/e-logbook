export type UserRole = "student" | "supervisor" | "itf_official" | "admin";

export const roleHomeRoute: Record<UserRole, string> = {
  student: "/student",
  supervisor: "/supervisor",
  itf_official: "/itf",
  admin: "/admin",
};
