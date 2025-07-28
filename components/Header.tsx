import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Fileuploader from "./Fileuploader";
import Search from "./Search";

const Header = () => {
  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <Fileuploader />
        <form action="">
          <Button type="submit" className="sign-out-button">
            <Image
              src="/assets/icons/logout.svg"
              alt="logout"
              width={24}
              height={24}
              className="w-6"
            />
          </Button>
        </form>
      </div>
    </header>
  );
};

export default Header;
