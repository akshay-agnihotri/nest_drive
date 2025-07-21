"use server";
// node-appwrite
import { cookies } from "next/headers";
import appWriteConfig from "./config";
import { Account, Client, Databases, Avatars, Storage } from "node-appwrite";

export const createSessionClient = async () => {
  if (!appWriteConfig.endpoint || !appWriteConfig.projectId) {
    throw new Error(
      "Appwrite endpoint and project ID must be defined in environment variables"
    );
  }

  const client = new Client()
    .setEndpoint(appWriteConfig.endpoint)
    .setProject(appWriteConfig.projectId);

  const session = (await cookies()).get("nest-drive-session");

  if (!session || !session.value) {
    throw new Error("No session found");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
  };
};

export const createAdminClient = async () => {
  if (
    !appWriteConfig.endpoint ||
    !appWriteConfig.projectId ||
    !appWriteConfig.secretKey
  ) {
    throw new Error(
      "Appwrite endpoint, project ID, and secret key must be defined in environment variables"
    );
  }

  const client = new Client();
  client
    .setEndpoint(appWriteConfig.endpoint)
    .setProject(appWriteConfig.projectId)
    .setKey(appWriteConfig.secretKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },

    get storage() {
      return new Storage(client);
    },
    get avatars() {
      return new Avatars(client);
    },
  };
};
