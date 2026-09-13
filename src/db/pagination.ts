export interface GroupPage<T> {
  groups: T[];
  hasMore: boolean;
}

export function paginateGroups<T>(
  all: T[],
  limit: number,
  offset = 0,
): GroupPage<T> {
  const slice = all.slice(offset, offset + limit + 1); // limit+1 probe
  const hasMore = slice.length > limit;
  return { groups: hasMore ? slice.slice(0, limit) : slice, hasMore };
}
