import type { File } from "buffer";

export interface UploadedFile extends File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  public_id?: string;
}
