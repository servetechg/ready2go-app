export interface ProfileDocumentRef {
  url: string;
  fileName: string;
  mimeType?: string;
}

export interface LocalProfileDocument {
  uri: string;
  name: string;
  mimeType: string;
  fileSize?: number;
}

export type ProfileDocumentValue = ProfileDocumentRef | LocalProfileDocument;

export function isLocalProfileDocument(
  doc: ProfileDocumentValue,
): doc is LocalProfileDocument {
  return 'uri' in doc;
}

export function getProfileDocumentLabel(doc: ProfileDocumentValue): string {
  return isLocalProfileDocument(doc) ? doc.name : doc.fileName;
}
