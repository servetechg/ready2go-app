export type PreparednessCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  taskCount: number;
  sortOrder: number;
};

export type PreparednessCategoryDetail = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  intro: string;
};

export type PreparednessTask = {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  sortOrder: number;
};

export type CategoriesResponse = { items: PreparednessCategory[] };

export type TasksResponse = { categoryId: string; items: PreparednessTask[] };
