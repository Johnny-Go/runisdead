import { useMemo, useCallback, useState } from "react";

import "./App.css";
import runisdead from "./assets/runisdead.png";
import { Image } from "./components/Image";
import { SearchBar } from "./components/SearchBar";
import { RunDisplay } from "./components/RunDisplay/RunDisplay.tsx";
import { remote, PersonalBestViewModel } from "./remote.ts";

export const App = () => {
  const { handleSearch, userId, runData, loading } = useStateForApp();

  return (
    <>
      <div className="bottomPadding">
        <Image src={runisdead} alt="Run is dead" />
      </div>
      <div className="bottomPadding">
        <SearchBar
          label="Search for Speedrun.com user"
          onSearch={handleSearch}
        />
      </div>
      <div>
        <RunDisplay userId={userId} runData={runData} loading={loading}/>
      </div>
    </>
  );
};

const useStateForApp = () => {
  const [userId, setUserId] = useState<string>("");
  const [runData, setRunData] = useState<PersonalBestDataViewModel>();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = useCallback(async (searchString: string) => {
    setLoading(true);
    setUserId("")
    setRunData(undefined);

    const user = await remote.speedrun.getUser(searchString);
    const userId = user?.data?.id;
    setUserId(userId);

    if (userId) {
      const pbs = await remote.speedrun.getUserPersonalBests(userId);
      const mappedRunData = mapData(pbs, userId);
      setRunData(mappedRunData);
    }

    setLoading(false);
  }, []);

  const mapData = (
    personalBests: PersonalBestViewModel[],
    userIdParam: string
  ): PersonalBestDataViewModel => {
    const mappedGamesByGameId = new Map<string, GameDataViewModel>();
    const mappedRunsByGameId = new Map<string, RunDataViewModel[]>();
    const mappedCategoriesByCategoryId = new Map<string, CategoryDataViewModel>();
    const mappedSubcategoriesBySubcategoryId = new Map<string, SubcategoryDataViewModel>();

    personalBests.forEach((personalBest) => {
      //don't include ILs
      if (personalBest.run.level) {
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
          const subcategoryValuesMap = new Map<string, SubcategoryValueDataViewModel>();
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
    loading,
  }), [handleSearch, userId, runData, loading]);
};

export type PersonalBestDataViewModel = {
  games: GameDataViewModel[];
  gameLookup: Map<string, GameDataViewModel>;
  categoryLookup: Map<string, CategoryDataViewModel>;
  subcategoryLookup: Map<string, SubcategoryDataViewModel>;
  runsByGameId: Map<string, RunDataViewModel[]>;
};

export type GameDataViewModel = {
  gameId: string;
  gameName: string;
  gameUrl: string;
};

export type CategoryDataViewModel = {
  categoryId: string;
  categoryName: string;
  gameId: string;
};

export type SubcategoryDataViewModel = {
  subcategoryId: string;
  subcategoryName: string;
  subcategoryValues: Map<string, SubcategoryValueDataViewModel>;
};

export type SubcategoryValueDataViewModel = {
  subcategoryValueId: string;
  subcategoryValueName: string;
};

export type RunDataViewModel = {
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
  subcategories: RunSubcategoryDataViewModel[];
};

type RunSubcategoryDataViewModel = {
  subcategoryId: string;
  subcategoryValueId: string;
};