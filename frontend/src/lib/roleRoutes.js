export function getDashboardPathForRole(role) {
  if (role === "admin" || role === "field_worker" || role === "analyst") {
    return "/dashboard/admin";
  }
  if (role === "volunteer") {
    return "/dashboard/volunteer";
  }
  return "/dashboard/user";
}
