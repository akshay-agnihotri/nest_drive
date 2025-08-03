"use server";

import { createAdminClient } from "../appwrite";
import { ID, Permission, Role } from "node-appwrite"; // 1. Import Permission and Role
import { getFileType } from "@/lib/utils"; // Assuming you have this utility function
import appWriteConfig from "../appwrite/config";

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
export const uploadFile = async (file: File, ownerId: string) => {
  let uploadedFile; // Declare here to access it in the outer catch block
  let createdFileDocument; // Declare here to access it in the nested catch block

  try {
    const { storage, databases } = await createAdminClient();

    const {
      projectId,
      endpoint,
      bucketId,
      databaseId,
      usersCollectionId,
      filesCollectionId,
    } = appWriteConfig;

    if (!file) {
      throw new Error("No file was provided to upload.");
    }
    if (!ownerId) {
      throw new Error("Owner ID is required to upload files.");
    }

    // Step 1: Upload the file to the bucket with specific user permissions
    uploadedFile = await storage.createFile(bucketId!, ID.unique(), file, [
      Permission.read(Role.user(ownerId)), // The user can read their own file
      Permission.update(Role.user(ownerId)), // The user can update their own file
      Permission.delete(Role.user(ownerId)), // The user can delete their own file
    ]);

    // --- Nested try...catch for database operations ---
    try {
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

      // Step 2: Create a document for the uploaded file
      createdFileDocument = await databases.createDocument(
        databaseId!,
        filesCollectionId!,
        ID.unique(),
        documentData
      );

      const newFileId = createdFileDocument.$id;

      const userDoc = await databases.getDocument(
        databaseId!,
        usersCollectionId!,
        ownerId
      );
      const existingFileIds =
        userDoc.files?.map((file: { $id: string }) => file.$id) || [];

      const updatedFileIds = [...existingFileIds, newFileId];

      // Step 3: Update the user's document
      await databases.updateDocument(databaseId!, usersCollectionId!, ownerId, {
        files: updatedFileIds,
      });

      console.log("File uploaded and user document updated successfully.");
      return { success: true, data: createdFileDocument };
    } catch (dbError) {
      // --- CLEANUP STEP ---
      console.error("Database operation failed. Starting cleanup...");
      // 1. Delete the file from storage.
      await storage.deleteFile(bucketId!, uploadedFile.$id);

      // 2. If the file document was created, delete it as well.
      if (createdFileDocument) {
        await databases.deleteDocument(
          databaseId!,
          filesCollectionId!,
          createdFileDocument.$id
        );
      }

      // --------------------
      throw dbError; // Re-throw the database error to be caught by the outer catch block
    }
    // ----------------------------------------------------
  } catch (error) {
    console.error("Error during file upload and document creation:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred." };
  }
};
