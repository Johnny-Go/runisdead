import { useMemo, useCallback, useState } from "react";

import "./App.css";
import runisdead from "./assets/runisdead.png";
import { Image } from "./components/Image";
import { SearchBar } from "./components/SearchBar";
import { remote } from "./remote.ts";

export const App = () => {
  const { handleSearch, userId } = useStateForApp();

  return (
    <>
      <div className="imagePadding">
        <Image src={runisdead} alt="Run is dead" />
      </div>
      <div>
        <SearchBar
          label="Search for Speedrun.com user"
          onSearch={handleSearch}
        />
        <div>My id is: {userId}</div>
      </div>
    </>
  );
};

const useStateForApp = () => {
  const [userId, setUserId] = useState<string>();

  const handleSearch = useCallback(async (searchString: string) => {
    const user = await remote.speedrun.getUser(searchString);
    if (user.data.id) {
      setUserId(user.data.id);
      const runs = await remote.speedrun.getUserPersonalBests(user.data.id);
      console.log(runs);
    }
  }, []);

  return useMemo(() => ({
    handleSearch,
    userId
  }), [handleSearch, userId]);
};
