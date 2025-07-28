"use server";
import appWriteConfig from "../appwrite/config";
import { createAdminClient, createSessionClient } from "../appwrite";
import { Client, ID, Query, Account } from "appwrite";
import { cookies } from "next/headers";

export const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appWriteConfig.databaseId!,
    appWriteConfig.usersCollectionId!,
    [Query.equal("email", email)]
  );

  return result.total > 0 ? result.documents[0] : null;
};

export const sendOtp = async (email: string) => {
  try {
    const client = new Client()
      .setEndpoint(appWriteConfig.endpoint!)
      .setProject(appWriteConfig.projectId!);

    const account = new Account(client);

    // 1. Send the OTP. This creates an auth user if they don't exist.
    const sessionToken = await account.createEmailToken(
      ID.unique(), // Let Appwrite generate the user ID
      email
    );
    const userId = sessionToken.userId;

    return { userId };
  } catch (error) {
    console.error("Cannot send the otp");
    throw error;
  }
};

export const createUser = async (
  email: string,
  fullName: string,
  userId: string
) => {
  try {
    const { databases, avatars } = await createAdminClient(); // Use admin client only for database creation
    // 1. Get the raw image data as an ArrayBuffer
    const avatarBuffer = await avatars.getInitials(fullName, 256, 256); // Returns a Promise<ArrayBuffer>
    // 2. Convert the ArrayBuffer to a Base64 string
    const base64Image = Buffer.from(avatarBuffer).toString("base64");
    // 3. Create the full Data URL
    const avatarUrl = `data:image/png;base64,${base64Image}`;

    const userDocument = await databases.createDocument(
      appWriteConfig.databaseId!,
      appWriteConfig.usersCollectionId!,
      userId,
      {
        email,
        fullName,
        avatar: avatarUrl, // Use the generated avatar URL
        accountId: userId, // Use userId as accountId
      }
    );

    if (!userDocument) {
      throw new Error("Failed to create new user");
    }

    // 4. Return the userId to the client to complete the login flow
    return { userId };
  } catch (error) {
    console.error("Error in createAccount flow:", error);
    throw error;
  }
};

export const loginUserWithOtp = async (userId: string, otp: string) => {
  try {
    const { account } = await createAdminClient();

    // 2. Verify the OTP and create a new session
    const session = await account.createSession(userId, otp);

    console.log("Session created:", session);

    // 3. Set the session cookie in the browser
    // This is the crucial step to make the user logged in
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expire), // Set cookie expiration
    });

    console.log("User logged in successfully!");
    return { success: true, user: session.userId }; // Return a success status
  } catch (error) {
    console.error("Error in loginUserWithOtp:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // 1. Get the authenticated user from the Auth service
    const { account } = await createSessionClient();
    const authUser = await account.get();

    // 2. Get the user's data from your custom Database collection
    const userDocument = await getUserByEmail(authUser.email);

    if (!userDocument) {
      throw new Error("User not found in the database");
    }
    
    return userDocument;
  } catch (error) {
    console.error("Error getting current user:", error);
    throw error;
  }
};
