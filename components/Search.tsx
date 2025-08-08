"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

const Search = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Debounced search function to avoid too many URL updates
  const debouncedSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term.trim()) {
      params.set("search", term.trim());
    } else {
      params.delete("search");
    }

    // Keep existing sort parameter
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  // Update search term when URL changes (browser back/forward)
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchTerm(currentSearch);
  }, [searchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    debouncedSearch("");
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <SearchIcon className="search-icon" size={20} />
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search files..."
          className="search-input"
        />
        {searchTerm && (
          <button onClick={clearSearch} className="search-clear" type="button">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default Search;
