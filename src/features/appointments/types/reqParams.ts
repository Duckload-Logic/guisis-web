export type QueryParam = {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: string;
  sortOrder?: "asc" | "desc";
  statusId?: number;
  startDate?: string;
  endDate?: string;
};

