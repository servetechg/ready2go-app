import { apiRequest } from '@/services/api/client';
import type {
  CategoriesResponse,
  PreparednessCategoryDetail,
  TasksResponse,
} from '@/types/preparedness';

export const preparednessService = {
  async getCategories(token: string, q?: string): Promise<CategoriesResponse> {
    const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return apiRequest<CategoriesResponse>(`/preparedness/categories${params}`, { token });
  },

  async getCategory(token: string, categoryId: string): Promise<PreparednessCategoryDetail> {
    return apiRequest<PreparednessCategoryDetail>(
      `/preparedness/categories/${encodeURIComponent(categoryId)}`,
      { token },
    );
  },

  async getTasks(token: string, categoryId: string): Promise<TasksResponse> {
    return apiRequest<TasksResponse>(
      `/preparedness/categories/${encodeURIComponent(categoryId)}/tasks`,
      { token },
    );
  },
};
