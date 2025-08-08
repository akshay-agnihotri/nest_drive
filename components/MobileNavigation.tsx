"use client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@radix-ui/react-separator";
import { navItems } from "@/lib/constants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Fileuploader from "./Fileuploader";
import { signOut } from "@/lib/actions/user.action";

const MobileNavigation = ({
  avatar,
  fullName,
  email,
  ownerId,
}: {
  avatar: string;
  fullName: string;
  email: string;
  ownerId: string;
}) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="mobile-header">
      <Image
        src="/Logo.svg"
        alt="Logo"
        width={120}
        height={52}
        className="h-fit"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="shad-sheet h-screen px-3 overflow-scroll">
          <SheetTitle>
            <div className="header-user">
              <Image
                src={avatar}
                alt="avatar"
                width={44}
                height={44}
                className="header-user-avatar"
              />
              <div className="sm:hidden lg:block">
                <p className="subtitle-2 capitalize">{fullName}</p>
                <p className="caption">{email}</p>
              </div>
            </div>
            <Separator className="mb-4 bg-light-200/20" />
          </SheetTitle>

          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {navItems.map(({ name, icon, url }) => (
                <li key={name} className="lg:w-full">
                  <Link
                    href={url}
                    className={cn(
                      "mobile-nav-item",
                      pathname === url && "shad-active"
                    )}
                  >
                    <Image
                      src={icon}
                      alt={`${name} icon`}
                      width={24}
                      height={24}
                      className={cn(
                        "nav-icon",
                        pathname === url && "nav-icon-active"
                      )}
                    />
                    <p>{name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Separator className="my-5 bg-light-200/20" />

          <div className="flex flex-col justify-between gap-5 pb-5">
            <Fileuploader ownerId={ownerId} className="" />
            <form action={signOut}>
              <Button type="submit" className="mobile-sign-out-button">
                <Image
                  src="/assets/icons/logout.svg"
                  alt="Logout"
                  width={24}
                  height={24}
                />
                <p>Logout</p>
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNavigation;
