export const getAdminToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
};

export const setAdminToken = (token: string) => {
  document.cookie = `admin_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
};

export const clearAdminToken = () => {
  document.cookie = 'admin_token=; path=/; max-age=0';
};
