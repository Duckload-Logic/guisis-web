export type QueryParam = {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: string;
  sortOrder?: "asc" | "desc";
  statusId?: number;
  categoryId?: number | string;
  urgency?: string;
  startDate?: string;
  endDate?: string;
  scope?: string;
};

