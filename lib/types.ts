export interface FileDocument {
  name: string;
  type: string;
  bucketField: string;
  accountId: string;
  extension: string;
  size: number;
  $id: string;
  $sequence: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: Array<string>;
  $databaseId: string;
  $collectionId: string;
}

export interface UserDocument {
  $id: string;
  email: string;
  fullName: string;
  avatar: string;
  accountId: string;
  files?: Array<{
    $id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

export interface ActionType {
  label: string;
  icon: string;
  value: string;
}
