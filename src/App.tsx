import { useMemo, useCallback, useState } from "react";

import "./App.css";
import runisdead from "./assets/runisdead.png";
import { Image } from "./components/Image";
import { SearchBar } from "./components/SearchBar";
import { RunDisplay } from "./components/RunDisplay.tsx";
import { remote, PersonalBestViewModel } from "./remote.ts";

export const App = () => {
  const { handleSearch, userId, runData } = useStateForApp();

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
        <div>Number of Games: {runData?.games?.length}</div>
      </div>
      <div>
        <RunDisplay runData={runData} />
      </div>
    </>
  );
};

const useStateForApp = () => {
  const [userId, setUserId] = useState<string>();
  const [runData, setRunData] = useState<RunDataViewModel>();

  const handleSearch = useCallback(async (searchString: string) => {
    const user = await remote.speedrun.getUser(searchString);
    const userId = user?.data?.id;

    if (userId) {
      setUserId(userId);
      const pbs = await remote.speedrun.getUserPersonalBests(userId);
      const mappedRunData = mapData(pbs, userId);
      console.log(mappedRunData);
      setRunData(mappedRunData);
    }
  }, []);

  const mapData = (
    personalBests: PersonalBestViewModel[],
    userIdParam: string
  ): RunDataViewModel => {
    const mappedGamesByGameId = new Map<string, GameViewModel>();
    const mappedRunsByGameId = new Map<string, RunViewModel[]>();
    const mappedCategoriesByCategoryId = new Map<string, CategoryViewModel>();
    const mappedSubcategoriesBySubcategoryId = new Map<string, SubcategoryViewModel>();

    personalBests.forEach((personalBest) => {
      //don't include ILs
      if(personalBest.run.level) {
        return;
      }

      const gameData = personalBest.game.data;
      const gameId = gameData.id;
      const pbRunData = personalBest.run;
      const categoryData = personalBest.category.data;
      const categoryId = categoryData.id

      //build map of games
      mappedGamesByGameId.set(gameId, {
        gameId: gameId,
        gameName: gameData.names.international,
        gameUrl: gameData.weblink,
      });

      //get subcategories for each category, as well as their values
      categoryData.variables.data.forEach((subcategory) => {
        if (subcategory["is-subcategory"] === true) {
          const subcategoryValuesMap = new Map<string, SubcategoryValueViewModel>();
          //lol this JSON, why isn't this an array?
          for (const [key, value] of Object.entries(subcategory.values.values)) {
            subcategoryValuesMap.set(key, {
              subcategoryValueId: key,
              subcategoryValueName: value.label,
            });
          }

          mappedSubcategoriesBySubcategoryId.set(subcategory.id, {
              subcategoryId: subcategory.id,
              subcategoryName: subcategory.name,
              subcategoryValues: subcategoryValuesMap,
          });
        }
      });

      //build map of categories
      mappedCategoriesByCategoryId.set(categoryId, {
        categoryId: categoryId,
        categoryName: categoryData.name,
        gameId: gameId,
      });

      //create a run map for the game if it doesn't exist
      let runArray = mappedRunsByGameId.get(gameId);
      if (!runArray) {
        runArray = [];
        mappedRunsByGameId.set(gameId, runArray);
      }

      //get the subcategories for the run
      const runSubcategories = [];
      for (const [key, value] of Object.entries(pbRunData.values)) {
        if (mappedSubcategoriesBySubcategoryId.get(key)) {
          runSubcategories.push({
            subcategoryId: key,
            subcategoryValueId: value,
          });
        }
      }

      runArray.push({
        runId: pbRunData.id,
        gameId: pbRunData.game,
        categoryId: pbRunData.category,
        userId: userIdParam,
        runUrl: pbRunData.weblink,
        place: personalBest.place,
        times: {
          primaryTime: pbRunData.times.primary_t,
          realTime: pbRunData.times.realtime_t,
          realTimeNoLoads: pbRunData.times.realtime_noloads_t,
          inGameTime: pbRunData.times.ingame_t,
        },
        subcategories: runSubcategories,
      });
    });

    return {
      games: Array.from(mappedGamesByGameId.values()).sort((a,b) => a.gameName.localeCompare(b.gameName)),
      gameLookup: mappedGamesByGameId,
      categoryLookup: mappedCategoriesByCategoryId,
      subcategoryLookup: mappedSubcategoriesBySubcategoryId,
      runsByGameId: mappedRunsByGameId,
    };
  };

  return useMemo(() => ({
    handleSearch,
    userId,
    runData,
  }), [handleSearch, userId, runData]);
};

export type RunDataViewModel = {
  games: GameViewModel[];
  gameLookup: Map<string, GameViewModel>;
  categoryLookup: Map<string, CategoryViewModel>;
  subcategoryLookup: Map<string, SubcategoryViewModel>;
  runsByGameId: Map<string, RunViewModel[]>;
}

type GameViewModel = {
  gameId: string;
  gameName: string;
  gameUrl: string;
};

export type CategoryViewModel = {
  categoryId: string;
  categoryName: string;
  gameId: string;
};

export type SubcategoryViewModel = {
  subcategoryId: string;
  subcategoryName: string;
  subcategoryValues: Map<string, SubcategoryValueViewModel>;
};

export type SubcategoryValueViewModel = {
  subcategoryValueId: string;
  subcategoryValueName: string;
}

export type RunViewModel = {
  runId: string;
  gameId: string;
  categoryId: string;
  userId: string;
  runUrl: string;
  place: number;
  times: {
    primaryTime: number;
    realTime: number;
    realTimeNoLoads: number;
    inGameTime: number;
  };
  subcategories: RunSubcategoryViewModel[];
};

type RunSubcategoryViewModel = {
  subcategoryId: string;
  subcategoryValueId: string;
}