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

## Appwrite Client Architecture

The system uses two types of Appwrite clients for different permission scopes:

### `createAdminClient()`
- Uses API key for admin-level operations
- Required for operations that affect multiple users or need elevated permissions
- **Provides access to**: databases, storage
- **Cannot access**: account service (missing account scope)
- Used in: `uploadFile`, database operations in `shareFileWithUsers`, `deleteFile`

### `createSessionClient()`
- Uses user session cookies for user-scoped operations
- Limited to operations within the authenticated user's permissions
- **Provides access to**: databases, account (with user context)
- Used in: `renameFile`, `getCurrentUserFiles`, account operations

### Client Usage Strategy

Due to Appwrite's scope limitations, some functions require both clients:

- **Admin Client**: For database/storage operations requiring elevated permissions
- **Session Client**: For account operations to get current user info
- **Mixed Usage**: Functions like `shareFileWithUsers` and `deleteFile` use both clients

**Important**: Admin API keys don't have account scope, so we cannot consolidate all operations into a single admin client.

Example in `shareFileWithUsers`:
```typescript
// Admin client for database operations (elevated permissions)
const { databases } = await createAdminClient();

// Session client for account operations (user context)
const { account } = await createSessionClient();
const currentUser = await account.get();
```
const { databases, account } = await createAdminClient();
```

## Key Functions

### `shareFileWithUsers(fileId, emails, path)`

- Creates separate file documents for each target user
- Validates user has access to the source file
- Handles duplicate detection and error reporting
- Returns success count and failed emails
- **Clients**: Uses `createAdminClient()` for database operations + `createSessionClient()` for user verification

### `deleteFile(fileId, path)`

- Removes user's copy of the file
- Automatically cleans up storage if last copy
- Only affects the specific user's file document
- **Clients**: Uses `createAdminClient()` for database/storage operations + `createSessionClient()` for user verification

### `renameFile(fileId, newName, extension, path)`

- Updates only the user's copy of the file
- Validates ownership before allowing rename
- Other users' copies maintain their original names
- **Client**: Uses `createSessionClient()` for user-scoped operations (both database and account)

## Error Handling & Data Integrity

### Robust Error Handling

- **Comprehensive try-catch blocks** in all file operations
- **Graceful degradation** with user-friendly error messages
- **Automatic cleanup** on operation failures (prevents orphaned data)
- **Retry mechanisms** for network-related failures using `withRetry` utility

### Query Syntax

The system uses proper Appwrite Query syntax for database operations:

```typescript
// Correct: Using Query.equal() for filtering
const allFileDocuments = await databases.listDocuments(
  databaseId!,
  filesCollectionId!,
  [Query.equal("bucketField", fileToDelete.bucketField)]
);

// Incorrect: String-based queries (deprecated)
// [{ attribute: "bucketField", operator: "equal", value: fileToDelete.bucketField }]
```

### Data Cleanup Strategy

- **Smart Storage Management**: Storage files deleted only when last copy is removed
- **User Document Consistency**: File arrays updated atomically with document operations
- **Orphan Prevention**: Failed operations trigger cleanup of partially created data

## Benefits of This Architecture

1. **User Independence**: Users can manage their files without affecting others
2. **Storage Efficiency**: Single storage file supports multiple document copies
3. **Clear Ownership**: Each file copy has a single responsible user
4. **Scalable Sharing**: No limit on how many times a file can be shared
5. **Natural Cleanup**: Storage files are automatically removed when no longer needed
6. **Permission Simplicity**: No complex ACLs or permission matrices
7. **Performance Optimized**: Single client usage per operation reduces overhead
8. **Robust Error Handling**: Comprehensive error management with user-friendly messages
9. **Data Integrity**: Automatic cleanup prevents orphaned data and storage waste
10. **Modern Query Syntax**: Uses latest Appwrite Query APIs for optimal performance

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
