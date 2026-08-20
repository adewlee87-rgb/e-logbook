export type UserRole = "student" | "supervisor" | "admin";

export const roleHomeRoute: Record<UserRole, string> = {
  student: "/student",
  supervisor: "/supervisor",
  admin: "/admin",
};
