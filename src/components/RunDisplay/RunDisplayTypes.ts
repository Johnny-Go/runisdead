type BaseRunRowData = {
  runId: string;
  runUrl: string;
  time: number;
  categoryId: string;
  categoryName: string;
};

export type RunRowData = {
  place: number;
  subcategoryValueIds: string;
  subcategoryValueNames: string;
} & BaseRunRowData;

export type RunHistoryRowData = {
  date: string;
  status: string;
  reason?: string;
} & BaseRunRowData;