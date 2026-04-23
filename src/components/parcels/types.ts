export interface Parcel {
  id: number;
  type: string;
  imageBase64: string;
  contentType: string;
  createdAt: number;
  completedAt: number | null;
  note: string | null;
}
