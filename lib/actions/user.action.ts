//* Create account flow
//
// 1.User enters fullName and email
// 2.Check if user already exists
// 3.send the otp to the user's email
// 4.this will send a secret key for creating the session
// 5.Create a new user document if the user is a new user
// 6.return the user's accountId and that will be used to complete the login flow
// 7.Verify the OTP and authenticate to login
"use server";
import appWriteConfig from "../appwrite/config";
import { createAdminClient } from "../appwrite";
import { Client, ID, Query, Account } from "appwrite";

const getUserByEmail = async (email: string) => {
  if (!appWriteConfig.databaseId || !appWriteConfig.usersCollectionId) {
    throw new Error(
      "Database ID and users collection ID must be defined in environment variables"
    );
  }
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );

  return result.total > 0 ? result.documents[0] : null;
};

export const startOtpFlow = async (email: string, fullName?: string) => {
  try {
    // --- Use a STANDARD client for user-facing actions ---
    const client = new Client()
      .setEndpoint(appWriteConfig.endpoint!)
      .setProject(appWriteConfig.projectId!);

    const account = new Account(client);

    // --- The rest of the logic ---

    // 1. Send the OTP. This creates an auth user if they don't exist.
    const sessionToken = await account.createEmailToken(
      ID.unique(), // Let Appwrite generate the user ID
      email
    );
    const userId = sessionToken.userId;

    // 2. Check if a document for this user already exists in our database
    const existingUser = await getUserByEmail(email);

    // 3. If no document exists, create one using the ADMIN client
    if (!existingUser) {
      // Check if fullName was provided for the new user.
      if (!fullName) {
        throw new Error("Full name is required for a new account sign-up.");
      }

      const { databases, avatars } = await createAdminClient(); // Use admin client only for database creation

      const userDocument = await databases.createDocument(
        appWriteConfig.databaseId!,
        appWriteConfig.usersCollectionId!,
        userId, // Use the auth user's ID as the document ID
        {
          email,
          fullName,
          documentId: userId, // Store the user ID in the document
          avatar: avatars.getInitials(fullName).toString(),
        }
      );

      if (!userDocument) {
        throw new Error("Failed to create new user");
      }
    }

    // 4. Return the userId to the client to complete the login flow
    return { userId };
  } catch (error) {
    console.error("Error in createAccount flow:", error);
    throw error;
  }
};
