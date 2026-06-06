import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { preparednessService } from '@/services/preparedness.service';
import type { AuthState } from '@/types/auth';
import type {
  PreparednessCategory,
  PreparednessCategoryDetail,
  PreparednessTask,
} from '@/types/preparedness';
import { getErrorMessage } from '@/utils/error';
import {
  formatPreparednessText,
  formatPreparednessTitle,
} from '@/utils/preparednessLabels';

interface PreparednessState {
  categories: PreparednessCategory[];
  tasksByCategoryId: Record<string, PreparednessTask[]>;
  categoryDetails: Record<string, PreparednessCategoryDetail>;
  loading: boolean;
  tasksLoading: Record<string, boolean>;
  error: string | null;
}

const initialState: PreparednessState = {
  categories: [],
  tasksByCategoryId: {},
  categoryDetails: {},
  loading: false,
  tasksLoading: {},
  error: null,
};

function getToken(getState: () => unknown): string | null {
  return (getState() as { auth: AuthState }).auth.token;
}

function normalizeCategory(category: PreparednessCategory): PreparednessCategory {
  return {
    ...category,
    title: formatPreparednessTitle(category.title, category.id),
    subtitle: formatPreparednessText(category.subtitle),
  };
}

function normalizeCategoryDetail(
  detail: PreparednessCategoryDetail,
): PreparednessCategoryDetail {
  return {
    ...detail,
    title: formatPreparednessTitle(detail.title, detail.id),
    subtitle: formatPreparednessText(detail.subtitle),
    intro: formatPreparednessText(detail.intro),
  };
}

export const fetchCategories = createAsyncThunk(
  'preparedness/fetchCategories',
  async (q: string | undefined, { getState, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await preparednessService.getCategories(token, q);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not load guides'));
    }
  },
);

export const fetchCategoryDetail = createAsyncThunk(
  'preparedness/fetchCategoryDetail',
  async (categoryId: string, { getState, rejectWithValue }) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await preparednessService.getCategory(token, categoryId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Guide not found'));
    }
  },
);

export const fetchCategoryTasks = createAsyncThunk(
  'preparedness/fetchCategoryTasks',
  async (
    { categoryId, force }: { categoryId: string; force?: boolean },
    { getState, rejectWithValue },
  ) => {
    const token = getToken(getState);
    if (!token) return rejectWithValue('Not authenticated');

    const cached = (getState() as { preparedness: PreparednessState }).preparedness
      .tasksByCategoryId[categoryId];
    if (cached?.length && !force) {
      return { categoryId, items: cached };
    }

    try {
      return await preparednessService.getTasks(token, categoryId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Could not load tasks'));
    }
  },
);

const preparednessSlice = createSlice({
  name: 'preparedness',
  initialState,
  reducers: {
    clearPreparednessError: (state) => {
      state.error = null;
    },
    /** Clear cached lists when home address / jurisdiction may have changed. */
    clearPreparednessCache: (state) => {
      state.categories = [];
      state.tasksByCategoryId = {};
      state.categoryDetails = {};
      state.tasksLoading = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = [...action.payload.items]
          .map(normalizeCategory)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Could not load guides';
      })
      .addCase(fetchCategoryDetail.fulfilled, (state, action) => {
        state.categoryDetails[action.payload.id] = normalizeCategoryDetail(action.payload);
      })
      .addCase(fetchCategoryTasks.pending, (state, action) => {
        state.tasksLoading[action.meta.arg.categoryId] = true;
      })
      .addCase(fetchCategoryTasks.fulfilled, (state, action) => {
        const { categoryId, items } = action.payload;
        state.tasksByCategoryId[categoryId] = [...items].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        state.tasksLoading[categoryId] = false;
      })
      .addCase(fetchCategoryTasks.rejected, (state, action) => {
        state.tasksLoading[action.meta.arg.categoryId] = false;
        state.error = (action.payload as string) ?? 'Could not load tasks';
      });
  },
});

export const { clearPreparednessError, clearPreparednessCache } = preparednessSlice.actions;
export default preparednessSlice.reducer;
