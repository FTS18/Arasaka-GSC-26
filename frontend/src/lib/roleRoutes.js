export function getDashboardPathForRole(role) {
  if (role === "admin") {
    return "/dashboard/admin";
  }
  if (role === "volunteer") {
    return "/dashboard/volunteer";
  }
  return "/dashboard/user";
}
