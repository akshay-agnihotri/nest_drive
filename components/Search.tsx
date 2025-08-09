"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const Search = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Search function to update URL
  const performSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term.trim()) {
      params.set("search", term.trim());
    } else {
      params.delete("search");
    }

    // Keep existing sort parameter
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Update search term when URL changes (browser back/forward)
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchTerm(currentSearch);
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="search">
      <form onSubmit={handleSubmit} className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="Search"
          width={24}
          height={24}
          className="search-icon"
        />
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search files... (Press Enter to search)"
          className="search-input"
        />
        {searchTerm && (
          <Image
            src="/assets/icons/remove.svg"
            alt="Clear search"
            width={24}
            height={24}
            onClick={clearSearch}
            className="search-clear"
          />
        )}
      </form>
    </div>
  );
};

export default Search;
