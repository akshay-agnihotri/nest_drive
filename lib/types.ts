export interface FileDocument {
  $id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  bucketField: string;
  $createdAt: string;
  $updatedAt: string;
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
