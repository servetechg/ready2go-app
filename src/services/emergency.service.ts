import { buildMockEmergencyDashboard } from '@/constants/emergency';
import type { DashboardMode, EmergencyDashboardData } from '@/types/emergency';

/**
 * Static mock today — swap implementations when backend exposes:
 * GET /emergency/dashboard, GET /emergency/news, GET /emergency/incidents, GET /emergency/map
 */
export async function fetchEmergencyDashboard(
  mode: DashboardMode,
): Promise<EmergencyDashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return buildMockEmergencyDashboard(mode);
}
