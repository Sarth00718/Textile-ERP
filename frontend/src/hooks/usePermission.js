import { useAuthStore } from '../store/authStore';
import { can } from '../utils/permissions';

export function usePermission() {
  const role = useAuthStore((s) => s.user?.role);
  return {
    role,
    can: (moduleName, action) => can(role, moduleName, action),
  };
}
