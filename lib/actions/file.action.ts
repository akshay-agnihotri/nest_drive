"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { ID, Permission, Role, Query } from "node-appwrite"; // 1. Import Permission, Role, and Query
import { getFileType, withRetry } from "@/lib/utils"; // Import retry utility
import appWriteConfig from "../appwrite/config";
import { revalidatePath } from "next/cache";
import { getUserByEmail } from "./user.action";
import { UserDocument } from "../types";

/**
 * Test Appwrite connection health
 */
export const testAppwriteConnection = async () => {
  try {
    const { databases } = await createAdminClient();
    const { databaseId } = appWriteConfig;

    // Simple ping to check connection
    await databases.listCollections(databaseId!);
    return true;
  } catch (error) {
    console.error("Appwrite connection failed:", error);
    return false;
  }
};

/**
 * Uploads a single file to Appwrite Storage and creates a corresponding document in the database.
   1. Store the file document
   2. Get the ID of the newly stored file document.
   3. Fetch the user's existing list of files.
   4. Combine the old list with the new list.
   5. Update the user's document with the complete list of related files.
 * @param file - A single File object to upload.
 * @param ownerId - The document ID of the user in the 'users' collection.
 * @returns An object with success status and the created database document or an error message.
 */
export const uploadFile = async (file: File, ownerId: string, path: string) => {
  let uploadedFile: any = null;
  let createdFileDocument: any = null;
  let storage: any = null;
  let databases: any = null;

  try {
    const adminClient = await createAdminClient();
    storage = adminClient.storage;
    databases = adminClient.databases;

    const { bucketId, databaseId, usersCollectionId, filesCollectionId } =
      appWriteConfig;

    // Input validation
    if (!file) {
      throw new Error("No file was provided to upload.");
    }
    if (!ownerId) {
      throw new Error("Owner ID is required to upload files.");
    }

    // Step 1: Upload file to storage with retry
    uploadedFile = await withRetry(
      () =>
        storage.createFile(bucketId!, ID.unique(), file, [
          Permission.read(Role.any()),
          Permission.update(Role.user(ownerId)),
          Permission.delete(Role.user(ownerId)),
        ]),
      1,
      1000
    );

    if (!uploadedFile) {
      throw new Error("Failed to upload file to storage after retries");
    }

    try {
      // Step 2: Create file document
      const { type, extension } = getFileType(file.name);

      const documentData = {
        name: uploadedFile.name,
        // ✅ Don't store URL at all
        type: type,
        bucketField: uploadedFile.$id,
        accountId: ownerId,
        owner: ownerId,
        extension: extension || file.name.split(".").pop(),
        size: uploadedFile.sizeOriginal,
      };

      createdFileDocument = await withRetry(
        () =>
          databases.createDocument(
            databaseId!,
            filesCollectionId!,
            ID.unique(),
            documentData
          ),
        1,
        500
      );

      if (!createdFileDocument) {
        throw new Error("Failed to create file document after retries");
      }

      // Step 3: Update user document
      const userDoc = await withRetry(
        () => databases.getDocument(databaseId!, usersCollectionId!, ownerId),
        1,
        500
      );

      if (!userDoc) {
        throw new Error("Failed to fetch user document");
      }

      const existingFileIds =
        (userDoc as any).files?.map((file: { $id: string }) => file.$id) || [];
      const updatedFileIds = [...existingFileIds, createdFileDocument.$id];

      await withRetry(
        () =>
          databases.updateDocument(databaseId!, usersCollectionId!, ownerId, {
            files: updatedFileIds,
          }),
        1,
        500
      );

      revalidatePath(path);
      console.log("File uploaded and user document updated successfully.");
      return { success: true, data: createdFileDocument };
    } catch (dbError) {
      console.error("Database operation failed. Starting cleanup...");

      // Safe cleanup with error handling
      await safeCleanup(
        storage,
        databases,
        uploadedFile,
        createdFileDocument,
        bucketId!,
        databaseId!,
        filesCollectionId!
      );

      throw dbError;
    }
  } catch (error) {
    console.error("Error during file upload and document creation:", error);

    // ✅ Fixed: Only cleanup if we have storage and databases initialized
    if (storage && databases && uploadedFile && !createdFileDocument) {
      try {
        await safeCleanup(
          storage,
          databases,
          uploadedFile,
          null,
          appWriteConfig.bucketId!,
          appWriteConfig.databaseId!,
          appWriteConfig.filesCollectionId!
        );
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
        // Don't throw cleanup errors
      }
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
};

// Helper function for safe cleanup
const safeCleanup = async (
  storage: any,
  databases: any,
  uploadedFile: any,
  createdFileDocument: any,
  bucketId: string,
  databaseId: string,
  filesCollectionId: string
) => {
  // Clean up storage file
  if (uploadedFile) {
    try {
      await storage.deleteFile(bucketId, uploadedFile.$id);
      console.log("Storage file cleaned up successfully");
    } catch (cleanupError) {
      console.error("Failed to cleanup storage file:", cleanupError);
      // Don't throw - just log the error
    }
  }

  // Clean up database document
  if (createdFileDocument) {
    try {
      await databases.deleteDocument(
        databaseId,
        filesCollectionId,
        createdFileDocument.$id
      );
      console.log("Database document cleaned up successfully");
    } catch (cleanupError) {
      console.error("Failed to cleanup database document:", cleanupError);
      // Don't throw - just log the error
    }
  }
};

/**
 * Fetches the files associated with a specific user, with an option to filter by type.
 * @param ownerId - The document ID of the user in the 'users' collection.
 * @param type - The type of files to filter by (e.g., 'image', 'document'). If omitted, all files are returned.
 * @returns An array of file documents.
 */
export const getFiles = async (ownerId: string, type?: string) => {
  try {
    // 1. Get the databases service from our admin client
    const { databases } = await createAdminClient();
    const { databaseId, usersCollectionId } = appWriteConfig;

    if (!ownerId) {
      return {
        success: false,
        error: "INVALID_OWNER",
        message: "Owner ID is required to get files",
        files: [],
      };
    }

    // 2. Fetch the specific user's document from the 'users' collection
    const userDoc = await databases.getDocument(
      databaseId!,
      usersCollectionId!,
      ownerId
    );

    if (!userDoc) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "User document not found in database",
        files: [],
      };
    }

    // 3. Check if the user has any files
    if (!userDoc.files || userDoc.files.length === 0) {
      return {
        success: true,
        error: null,
        message: "No files uploaded yet",
        files: [],
      };
    }

    // 4. Filter the files based on the 'type' parameter, if provided
    if (type && type !== "all") {
      const filteredFiles = userDoc.files.filter(
        (file: { type: string }) => file.type === type
      );

      return {
        success: true,
        error: null,
        message:
          filteredFiles.length === 0 ? `No ${type} files found` : "Success",
        files: filteredFiles,
      };
    }

    // 5. Return all files
    return {
      success: true,
      error: null,
      message: "Success",
      files: userDoc.files,
    };
  } catch (error) {
    console.error("Error fetching files:", error);

    // Return error info instead of empty array
    return {
      success: false,
      error: "FETCH_ERROR",
      message: "Unable to load files due to connection issues",
      files: [],
    };
  }
};

/**
 * Gets files for the current authenticated user with optional type filtering
 * @param type - The type of files to filter by (e.g., 'image', 'document', 'all'). If omitted, all files are returned.
 * @returns An object with files array and total size, or redirect info if user not authenticated
 */
export const getCurrentUserFiles = async (type?: string) => {
  try {
    // Get current user with error handling
    let authUser;
    try {
      const { account } = await createSessionClient();
      authUser = await account.get();
    } catch (sessionError) {
      console.error("Session error in getCurrentUserFiles:", sessionError);
      return {
        files: [],
        totalSize: 0,
        error: "SESSION_ERROR",
        message: "Unable to verify your session. Please refresh the page.",
      };
    }

    if (!authUser?.email) {
      return {
        files: [],
        totalSize: 0,
        error: "NO_SESSION",
        message: "No valid session found. Please refresh the page.",
      };
    }

    // Get user document with error handling
    let userDocument;
    try {
      userDocument = await getUserByEmail(authUser.email);
    } catch (userError) {
      console.error("Error getting user by email:", userError);
      return {
        files: [],
        totalSize: 0,
        error: "USER_FETCH_ERROR",
        message: "Unable to load user profile. Please try again.",
      };
    }

    if (!userDocument) {
      return {
        files: [],
        totalSize: 0,
        error: "USER_NOT_FOUND",
        message: "User profile not found. Please contact support.",
      };
    }

    // Get files with error handling
    const result = await withRetry(
      () => getFiles(userDocument.$id, type),
      1,
      300
    );

    if (!result || !result.success) {
      return {
        files: [],
        totalSize: 0,
        error: result?.error || "FETCH_ERROR",
        message: result?.message || "Unable to load files. Please try again.",
      };
    }

    const files = result.files || [];
    const totalSize = (files as { size: number }[]).reduce(
      (sum: number, file: { size: number }) => sum + (file?.size || 0),
      0
    );

    return {
      files,
      totalSize,
      error: files.length === 0 ? "NO_FILES" : null,
      message: result.message,
    };
  } catch (error) {
    console.error("Unexpected error in getCurrentUserFiles:", error);
    return {
      files: [],
      totalSize: 0,
      error: "UNEXPECTED_ERROR",
      message: "Something went wrong. Please refresh the page.",
    };
  }
};

export const renameFile = async (
  fileId: string,
  newName: string,
  extension: string,
  path: string
) => {
  try {
    const { databases, account } = await createSessionClient();
    const { databaseId, filesCollectionId } = appWriteConfig;

    if (!newName?.trim()) {
      return {
        success: false,
        error: "NAME_REQUIRED",
        message: "New file name cannot be empty.",
      };
    }

    // Sanitize filename (remove invalid characters)
    const sanitizedName = newName.trim().replace(/[<>:"/\\|?*]/g, "");

    if (sanitizedName.length === 0) {
      return {
        success: false,
        error: "INVALID_NAME",
        message: "File name contains only invalid characters.",
      };
    }

    const fullName = `${sanitizedName}.${extension}`;

    // Get current file document to verify ownership
    const currentFile = await withRetry(
      () => databases.getDocument(databaseId!, filesCollectionId!, fileId),
      1,
      300
    );

    if (!currentFile) {
      return {
        success: false,
        error: "FILE_NOT_FOUND",
        message: "File not found or has been deleted.",
      };
    }

    // Get current user to verify they own this file copy
    const currentUser = await account.get();

    console.log("Current file:", currentFile);
    console.log("Current user ID:", currentUser.$id);
    console.log("File owner:", currentFile.accountId);

    if (currentFile.accountId !== currentUser.$id) {
      return {
        success: false,
        error: "PERMISSION_DENIED",
        message: "You can only rename your own copy of this file.",
      };
    }

    // Check if name is actually different
    if (currentFile.name === fullName) {
      return {
        success: true,
        data: currentFile,
        message: "File name is already up to date.",
      };
    }

    // Update ONLY this user's file document with new name
    // This won't affect other users' copies of the same file
    const updatedFile = await withRetry(
      () =>
        databases.updateDocument(databaseId!, filesCollectionId!, fileId, {
          name: fullName,
        }),
      1,
      500
    );

    if (!updatedFile) {
      return {
        success: false,
        error: "UPDATE_FAILED",
        message: "Failed to rename file. Please try again.",
      };
    }

    // Revalidate the path to update UI
    revalidatePath(path);

    console.log(
      `File renamed: ${currentFile.name} → ${fullName} (user copy only)`
    );

    return {
      success: true,
      data: updatedFile,
      message: `File renamed to "${fullName}"`,
    };
  } catch (error) {
    console.error("Error renaming file:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: "RENAME_ERROR",
        message: error.message,
      };
    }

    return {
      success: false,
      error: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
};

export const deleteFile = async (fileId: string, path: string) => {
  try {
    const { databases, storage } = await createAdminClient();
    const { databaseId, filesCollectionId, usersCollectionId, bucketId } =
      appWriteConfig;

    // Get current file document
    const fileToDelete = await withRetry(
      () => databases.getDocument(databaseId!, filesCollectionId!, fileId),
      1,
      300
    );

    if (!fileToDelete) {
      return {
        success: false,
        error: "FILE_NOT_FOUND",
        message: "File not found or has been deleted.",
      };
    }

    // Get current user to verify they own this file copy
    const { account } = await createSessionClient();
    const currentUser = await account.get();

    if (fileToDelete.accountId !== currentUser.$id) {
      return {
        success: false,
        error: "PERMISSION_DENIED",
        message: "You don't have permission to delete this file.",
      };
    }

    // Get current user document
    const currentUserDoc = await getUserByEmail(currentUser.email);
    if (!currentUserDoc) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "Your user profile was not found.",
      };
    }

    // Check if this is the last copy of the file (same bucketField)
    // If so, we need to delete the storage file too
    const allFileDocuments = await databases.listDocuments(
      databaseId!,
      filesCollectionId!,
      [Query.equal("bucketField", fileToDelete.bucketField)]
    );

    const otherCopies = allFileDocuments.documents.filter(
      (doc: any) => doc.$id !== fileId
    );

    // Remove file from user's files list
    const userFileIds =
      currentUserDoc.files?.map((file: { $id: string }) => file.$id) || [];
    const updatedFileIds = userFileIds.filter((id: string) => id !== fileId);

    await withRetry(
      () =>
        databases.updateDocument(
          databaseId!,
          usersCollectionId!,
          currentUserDoc.$id,
          {
            files: updatedFileIds,
          }
        ),
      1,
      500
    );

    // Delete the file document
    await withRetry(
      () => databases.deleteDocument(databaseId!, filesCollectionId!, fileId),
      1,
      500
    );

    // If this was the last copy, delete the storage file too
    if (otherCopies.length === 0) {
      try {
        await withRetry(
          () => storage.deleteFile(bucketId!, fileToDelete.bucketField),
          1,
          500
        );
        console.log(
          `Storage file ${fileToDelete.bucketField} deleted (last copy)`
        );
      } catch (storageError) {
        console.warn("Failed to delete storage file:", storageError);
        // Don't fail the operation if storage deletion fails
      }
    }

    // Revalidate the path to update UI
    revalidatePath(path);

    console.log(
      `File deleted: ${fileToDelete.name} (${otherCopies.length} copies remaining)`
    );

    return {
      success: true,
      message: `File "${fileToDelete.name}" deleted successfully`,
      wasLastCopy: otherCopies.length === 0,
    };
  } catch (error) {
    console.error("Error deleting file:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: "DELETE_ERROR",
        message: error.message,
      };
    }

    return {
      success: false,
      error: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
};

export const shareFileWithUser = async (
  fileId: string,
  userToShareFile: UserDocument | null,
  path: string
) => {
  try {
    const { databases } = await createAdminClient();
    const { databaseId, filesCollectionId, usersCollectionId } = appWriteConfig;

    // Validate input
    if (!userToShareFile) {
      return {
        success: false,
        error: "NO_USER_SELECTED",
        message: "Please select a user to share the file with.",
      };
    }

    // Get current file document
    const sourceFile = await withRetry(
      () => databases.getDocument(databaseId!, filesCollectionId!, fileId),
      1,
      300
    );

    if (!sourceFile) {
      return {
        success: false,
        error: "CONNECTION_ERROR",
        message: "Check your internet connection and try again.",
      };
    }

    // Get current user to verify they have access to this file
    const { account } = await createSessionClient();
    const currentUser = await account.get();
    const currentUserDoc = await getUserByEmail(currentUser.email);

    if (!currentUserDoc) {
      return {
        success: false,
        error: "USER_NOT_FOUND",
        message: "Your user profile was not found.",
      };
    }

    // Check if trying to share with yourself
    if (userToShareFile.$id === currentUser.$id) {
      return {
        success: false,
        error: "SELF_SHARE_ERROR",
        message: "You cannot share a file with yourself.",
      };
    }

    // Check if user already has this file (avoid duplicates)
    const targetUserFileIds =
      userToShareFile.files?.map((file: { $id: string }) => file.$id) || [];
    const existingFile = userToShareFile.files?.find(
      (file: any) =>
        file.bucketField === sourceFile.bucketField &&
        file.name === sourceFile.name
    );

    if (existingFile) {
      return {
        success: false,
        error: "DUPLICATE_SHARE",
        message: `${userToShareFile.fullName} already has this file.`,
      };
    }

    try {
      // Create a new file document for the target user
      const sharedFileDocument = await withRetry(
        () =>
          databases.createDocument(
            databaseId!,
            filesCollectionId!,
            ID.unique(),
            {
              name: sourceFile.name,
              type: sourceFile.type,
              bucketField: sourceFile.bucketField, // Same storage file
              accountId: userToShareFile.$id, // Different owner
              owner: userToShareFile.$id, // Different owner
              extension: sourceFile.extension,
              size: sourceFile.size,
            }
          ),
        1,
        500
      );

      if (!sharedFileDocument) {
        return {
          success: false,
          error: "SHARE_FAILED",
          message: "Failed to create shared file document.",
        };
      }

      try {
        // Add the new file to the target user's files list
        const updatedFileIds = [...targetUserFileIds, sharedFileDocument.$id];

        await withRetry(
          () =>
            databases.updateDocument(
              databaseId!,
              usersCollectionId!,
              userToShareFile.$id,
              {
                files: updatedFileIds,
              }
            ),
          1,
          500
        );

        // Revalidate the path to update UI
        revalidatePath(path);

        console.log(`File shared successfully with ${userToShareFile.email}`);

        return {
          success: true,
          data: sourceFile,
          message: `File shared with ${userToShareFile.fullName}`,
          targetUser: userToShareFile,
        };
      } catch (updateError) {
        // If user document update fails, cleanup the created file document
        console.error(
          `Failed to update user document for ${userToShareFile.email}, cleaning up created file document:`,
          updateError
        );

        try {
          await databases.deleteDocument(
            databaseId!,
            filesCollectionId!,
            sharedFileDocument.$id
          );
          console.log(
            `Cleaned up file document ${sharedFileDocument.$id} after user update failure`
          );
        } catch (cleanupError) {
          console.error(
            `Failed to cleanup file document ${sharedFileDocument.$id}:`,
            cleanupError
          );
        }

        return {
          success: false,
          error: "UPDATE_FAILED",
          message: "Failed to update user's file list. Please try again.",
        };
      }
    } catch (shareError) {
      console.error(
        `Failed to share file with ${userToShareFile.email}:`,
        shareError
      );
      return {
        success: false,
        error: "SHARE_ERROR",
        message: "Failed to create shared file copy. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error sharing file:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: "SHARE_ERROR",
        message: error.message,
      };
    }

    return {
      success: false,
      error: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
