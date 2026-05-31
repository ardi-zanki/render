export interface PutObjectParams {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface PutObjectResult {
  key: string;
  url: string;
}

/** Pluggable object storage provider (PRD §6.1). */
export interface StorageProvider {
  readonly name: string;
  putObject(params: PutObjectParams): Promise<PutObjectResult>;
  getSignedDownloadUrl(key: string, expiresSec?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  publicUrl(key: string): string;
}
