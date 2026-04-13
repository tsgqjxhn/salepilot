import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { pinia } from "@/stores/pinia";

export type PermissionRequirement = string | string[] | null | undefined;

export interface PermissionCheckOptions {
  fallbackRoles?: string[];
  mode?: "any" | "all";
}

export interface PermissionAccessSubject {
  role?: string | null;
  permissions?: string[] | null;
}

const ROLE_LABELS: Record<string, string> = {
  user: "Workspace Member",
  manager: "Sales Manager",
  admin: "Administrator",
};

const normalizeRole = (role?: string | null) => String(role || "").trim().toLowerCase();

const normalizePermissionList = (value: PermissionRequirement) => {
  if (Array.isArray(value)) {
    return value
      .filter((permission): permission is string => typeof permission === "string")
      .map((permission) => permission.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const roleMatches = (currentRole: string, fallbackRoles: string[] = []) => {
  if (!currentRole || fallbackRoles.length === 0) {
    return false;
  }

  return fallbackRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean)
    .includes(currentRole);
};

export const resolvePermissionAccess = (
  subject: PermissionAccessSubject,
  requiredPermissions: PermissionRequirement,
  options: PermissionCheckOptions = {},
) => {
  const permissions = normalizePermissionList(requiredPermissions);
  if (permissions.length === 0) {
    return true;
  }

  const subjectPermissions = Array.isArray(subject.permissions)
    ? subject.permissions
      .filter((permission): permission is string => typeof permission === "string")
      .map((permission) => permission.trim())
      .filter(Boolean)
    : [];

  const permissionSet = new Set(subjectPermissions);
  const currentRole = normalizeRole(subject.role);
  const hasMatchingRole = roleMatches(currentRole, options.fallbackRoles);

  const permissionSatisfied = options.mode === "all"
    ? permissions.every((permission) => permissionSet.has(permission))
    : permissions.some((permission) => permissionSet.has(permission));

  return permissionSatisfied || hasMatchingRole;
};

export function usePermissions() {
  const authStore = useAuthStore(pinia);

  const currentRole = computed(() => normalizeRole(authStore.userrole || localStorage.getItem("user_role")));
  const currentPermissions = computed(() => (
    Array.isArray(authStore.permissions)
      ? authStore.permissions
        .filter((permission): permission is string => typeof permission === "string")
        .map((permission) => permission.trim())
        .filter(Boolean)
      : []
  ));
  const currentPermissionSet = computed(() => new Set(currentPermissions.value));
  const roleLabel = computed(() => authStore.roleLabel || ROLE_LABELS[currentRole.value] || "Workspace Member");
  const roleMatrix = computed(() => authStore.roleMatrix);

  const hasPermission = (permission: string) => {
    if (typeof permission !== "string" || !permission.trim()) {
      return false;
    }

    return currentPermissionSet.value.has(permission.trim());
  };

  const hasAnyPermission = (requiredPermissions: PermissionRequirement, fallbackRoles: string[] = []) => {
    return resolvePermissionAccess(
      {
        role: currentRole.value,
        permissions: currentPermissions.value,
      },
      requiredPermissions,
      { fallbackRoles, mode: "any" },
    );
  };

  const hasAllPermissions = (requiredPermissions: PermissionRequirement, fallbackRoles: string[] = []) => {
    return resolvePermissionAccess(
      {
        role: currentRole.value,
        permissions: currentPermissions.value,
      },
      requiredPermissions,
      { fallbackRoles, mode: "all" },
    );
  };

  const can = (requiredPermissions: PermissionRequirement, options: PermissionCheckOptions = {}) => {
    if (options.mode === "all") {
      return hasAllPermissions(requiredPermissions, options.fallbackRoles);
    }

    return hasAnyPermission(requiredPermissions, options.fallbackRoles);
  };

  const hasRole = (role: string) => currentRole.value === normalizeRole(role);
  const hasAnyRole = (roles: string[]) => roleMatches(currentRole.value, roles);

  return {
    currentRole,
    roleLabel,
    currentPermissions,
    roleMatrix,
    isAdmin: computed(() => hasRole("admin")),
    isManager: computed(() => hasRole("manager")),
    isManagerOrAdmin: computed(() => hasAnyRole(["manager", "admin"])),
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
  };
}
