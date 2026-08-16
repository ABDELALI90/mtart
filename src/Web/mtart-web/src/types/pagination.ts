/** Mirrors MTArt.SharedKernel.Pagination.PagedResult<T> - the shape every list endpoint returns. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
