"use server";
import appWriteConfig from "../appwrite/config";
import { createAdminClient } from "../appwrite";
import { Client, ID, Query, Account } from "appwrite";
import { cookies } from "next/headers";

export const getUserByEmail = async (email: string) => {
  if (!appWriteConfig.databaseId || !appWriteConfig.usersCollectionId) {
    throw new Error(
      "Database ID and users collection ID must be defined in environment variables"
    );
  }
  const { databases } = await createAdminClient();
  console.log("alright");

  const result = await databases.listDocuments(
    appWriteConfig.databaseId,
    appWriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );

  return result.total > 0 ? result.documents[0] : null;
};

export const sendOtp = async (email: string) => {
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
    
    console.log("Avatar URL:", avatarUrl);

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
    const client = new Client()
      .setEndpoint(appWriteConfig.endpoint!)
      .setProject(appWriteConfig.projectId!);
    const account = new Account(client);

    // 2. Verify the OTP and create a new session
    const session = await account.createSession(userId, otp);

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
