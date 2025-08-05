import Header from "@/components/Header";
import MobileNavigation from "@/components/MobileNavigation";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/actions/user.action";
import { withRetry } from "@/lib/utils";
import { redirect } from "next/navigation";

import React from "react";

const Layout = async ({ children }: { children: React.ReactNode }) => {
 
  const currentUser = await withRetry(() => getCurrentUser(), 1, 500);
  if (!currentUser) {
    return redirect("/sign-in");
  }

  return (
    <main className="flex h-screen">
      <Sidebar
        fullName={currentUser.fullName} 
        email={currentUser.email}
        avatar={currentUser.avatar}
      />
      <section className="flex h-full flex-1 flex-col">
        <MobileNavigation
          fullName={currentUser.fullName}
          email={currentUser.email}
          avatar={currentUser.avatar}
          ownerId={currentUser.$id}
        />
        <Header ownerId={currentUser.$id} />
        <div className="main-content">{children}</div>
      </section>
    </main>
  );
};

export default Layout;
