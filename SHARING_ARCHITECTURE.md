# File Sharing Architecture

## Overview

This document explains the copy-based file sharing system implemented in the StoreIt application. This architecture allows users to independently manage shared files while maintaining efficient storage usage.

## Core Concept: Copy-Based Sharing

Instead of maintaining a single file document with a list of users who have access, each user gets their own copy of the file document when a file is shared with them. This approach provides several benefits:

1. **Independent File Management**: Each user can rename, delete, or re-share their copy without affecting other users
2. **Clear Ownership**: Each file document has a single owner (accountId)
3. **Storage Efficiency**: All copies reference the same storage file (bucketField)
4. **Simplified Permissions**: No complex permission matrices to manage

## Database Schema

### Files Collection

Each file document contains:

```typescript
{
  name: string; // User-specific filename (can be different for each copy)
  type: string; // File type (image, document, etc.)
  bucketField: string; // Reference to the actual storage file (shared across copies)
  accountId: string; // Owner of this specific copy
  extension: string; // File extension
  size: number; // File size in bytes
  $id: string; // Unique document ID
  // ... other Appwrite fields
}
```

### Users Collection

Each user document contains:

```typescript
{
  email: string;
  fullName: string;
  files: Array<{
    // Array of file document references
    $id: string; // Reference to file documents owned by this user
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  // ... other fields
}
```

## File Operations

### Upload

1. Upload file to Appwrite Storage
2. Create file document with user as owner
3. Add file document ID to user's files array

### Share

1. Validate permissions (user must have access to the file)
2. For each target email:
   - Find user document
   - Create new file document with same bucketField but different owner
   - Add new file document ID to target user's files array
3. Multiple users can now independently manage their copies

### Rename

1. Verify user owns the specific file document
2. Update only that user's file document name
3. Other users' copies remain unchanged

### Delete

1. Verify user owns the specific file document
2. Remove file document ID from user's files array
3. Delete the file document
4. Check if this was the last copy (same bucketField)
5. If last copy, delete the storage file to free up space

## Key Functions

### `shareFileWithUsers(fileId, emails, path)`

- Creates separate file documents for each target user
- Validates user has access to the source file
- Handles duplicate detection and error reporting
- Returns success count and failed emails

### `deleteFile(fileId, path)`

- Removes user's copy of the file
- Automatically cleans up storage if last copy
- Only affects the specific user's file document

### `renameFile(fileId, newName, extension, path)`

- Updates only the user's copy of the file
- Validates ownership before allowing rename
- Other users' copies maintain their original names

## Benefits of This Architecture

1. **User Independence**: Users can manage their files without affecting others
2. **Storage Efficiency**: Single storage file supports multiple document copies
3. **Clear Ownership**: Each file copy has a single responsible user
4. **Scalable Sharing**: No limit on how many times a file can be shared
5. **Natural Cleanup**: Storage files are automatically removed when no longer needed
6. **Permission Simplicity**: No complex ACLs or permission matrices

## Migration from Previous System

If migrating from a reference-based system:

1. Files with `users` arrays need to be converted to separate documents
2. Each email in the `users` array should get their own file document
3. The original file document becomes the owner's copy
4. Update user documents to reference the new file document IDs

## Example Sharing Flow

1. **User A** uploads `document.pdf`
   - Storage: `bucket/abc123` contains the PDF data
   - Database: File document with `accountId: userA`, `bucketField: abc123`

2. **User A** shares with **User B**
   - New file document created with `accountId: userB`, `bucketField: abc123`
   - User B can now see and manage their copy

3. **User B** renames to `important-document.pdf`
   - Only User B's file document is updated
   - User A still sees `document.pdf`

4. **User A** deletes their copy
   - User A's file document is deleted
   - Storage file remains (User B still has a copy)

5. **User B** deletes their copy
   - User B's file document is deleted
   - Storage file is automatically deleted (no more copies exist)

This architecture provides a robust, scalable solution for file sharing while maintaining user autonomy and system efficiency.
