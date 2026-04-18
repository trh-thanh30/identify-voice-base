import { AudioPurpose, Role, type auth_accounts } from '@prisma/client';

export const ALL_PERMISSIONS = [
  'accounts.manage', // Quản lý tài khoản (tạo, cập nhật role/status/password/permissions)
  'profile.read', // Đọc thông tin profile cá nhân
  'profile.update', // Cập nhật thông tin profile cá nhân
  'profile.delete', // Xóa tài khoản cá nhân
  'voices.read', // Xem danh sách và chi tiết voiceprints
  'voices.enroll', // Đăng ký voiceprint mới
  'voices.update', // Cập nhật voiceprint (ví dụ: enroll thêm mẫu giọng nói)
  'voices.delete', // Xóa voiceprint
  'identify.run', // Chạy chức năng nhận diện giọng nói (identify)
  'sessions.read', // Xem danh sách và chi tiết các phiên đăng nhập
] as const;

export type AppPermission = (typeof ALL_PERMISSIONS)[number];

const APP_PERMISSION_SET = new Set<string>(ALL_PERMISSIONS);

export function normalizePermissions(input: unknown): AppPermission[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const permissions = input.filter(
    (permission): permission is AppPermission =>
      typeof permission === 'string' && APP_PERMISSION_SET.has(permission),
  );

  return [...new Set(permissions)];
}

export function getDefaultPermissionsForRole(role: Role): AppPermission[] {
  if (role === Role.ADMIN) {
    return [...ALL_PERMISSIONS];
  }

  return ['profile.read', 'voices.read', 'voices.enroll'];
}

export function resolveAccountPermissions(
  account: Pick<auth_accounts, 'role' | 'permissions'>,
): AppPermission[] {
  if (account.role === Role.ADMIN) {
    return getDefaultPermissionsForRole(Role.ADMIN);
  }

  const permissions = normalizePermissions(account.permissions);

  if (permissions.length > 0) {
    return permissions;
  }

  return getDefaultPermissionsForRole(Role.OPERATOR);
}

export function hasPermission(
  account: Pick<auth_accounts, 'role' | 'permissions'>,
  permission: AppPermission,
): boolean {
  if (account.role === Role.ADMIN) {
    return true;
  }

  return resolveAccountPermissions(account).includes(permission);
}

export function getPermissionForAudioPurpose(
  purpose: AudioPurpose,
): AppPermission {
  switch (purpose) {
    case AudioPurpose.ENROLL:
      return 'voices.enroll';
    case AudioPurpose.IDENTIFY:
      return 'identify.run';
    case AudioPurpose.UPDATE_VOICE:
      return 'voices.update';
  }
}
