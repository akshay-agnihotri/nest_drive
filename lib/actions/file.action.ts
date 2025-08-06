"use server";

import { createAdminClient, createSessionClient } from "../appwrite";
import { ID, Permission, Role } from "node-appwrite"; // 1. Import Permission and Role
import { getFileType, withRetry } from "@/lib/utils"; // Import retry utility
import appWriteConfig from "../appwrite/config";
import { revalidatePath } from "next/cache";
import { getUserByEmail } from "./user.action";

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

    const {
      projectId,
      endpoint,
      bucketId,
      databaseId,
      usersCollectionId,
      filesCollectionId,
    } = appWriteConfig;

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
          Permission.read(Role.user(ownerId)),
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
      const fileUrl = `${endpoint}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${projectId}`;
      const { type, extension } = getFileType(file.name);

      const documentData = {
        name: uploadedFile.name,
        url: fileUrl,
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
