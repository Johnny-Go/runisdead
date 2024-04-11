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
        <RunDisplay runData={runData}/>
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

  const mapData = (personalBests: PersonalBestViewModel[], userIdParam: string): RunDataViewModel => {
    const mappedGamesByGameId = new Map<string, GameViewModel>();
    const mappedRunsByGameId = new Map<string, RunViewModel[]>();
    const mappedCategoriesByGameId = new Map<string, Map<string, CategoryViewModel>>();

    personalBests.forEach((personalBest) => {
      const gameId = personalBest.game.data.id;
      const gameData = personalBest.game.data;
      const runData = personalBest.run;
      const categoryData = personalBest.category.data;

      //build map of games
      mappedGamesByGameId.set(gameId, {
        gameId: gameId,
        gameName: gameData.names.international,
        gameUrl: gameData.weblink
      });

      //create category map for the game if it doesn't exist
      let categoryMap = mappedCategoriesByGameId.get(gameId);
      if (!categoryMap) {
        categoryMap = new Map();
        mappedCategoriesByGameId.set(gameId, categoryMap);
      }

      //get subcategories for each category, as well as their values
      const subcategoryMap = new Map<string, SubcategoryViewModel>()
      categoryData.variables.data.forEach((subcategory) => {
        if (subcategory["is-subcategory"] === true) {
          const subcategoryValuesMap = new Map<string, SubcategoryValueViewModel>();
          //lol this JSON, why isn't this an array?
          for (const [key, value] of Object.entries(subcategory.values.values)) {
            subcategoryValuesMap.set(key, {
              subcategoryValueId: key,
              subcategoryName: value.label
            });
          }

          subcategoryMap.set(subcategory.id, {
              subcategoryId: subcategory.id,
              subcategoryName: subcategory.name,
              subcategoryValues: subcategoryValuesMap
          });
        }
      });

      //create a run map for the game if it doesn't exist
      let runArray = mappedRunsByGameId.get(gameId);
      if (!runArray) {
        runArray = [];
        mappedRunsByGameId.set(gameId, runArray);
      }

      //get the subcategories for the run
      const runSubcategories = [];
      for (const [key, value] of Object.entries(runData.values)) {
        if(subcategoryMap.get(key)) {
          runSubcategories.push({
            subcategoryId: key,
            subcategoryValueId: value
          });
        }
      }

      runArray.push({
        runId: runData.id,
        gameId: runData.game,
        categoryId: runData.category,
        userId: userIdParam,
        runUrl: runData.weblink,
        place: personalBest.place,
        times: {
          primaryTime: runData.times.primary_t,
          realTime: runData.times.realtime_t,
          realTimeNoLoads: runData.times.realtime_noloads_t,
          inGameTime: runData.times.ingame_t
        },
        subcategories: runSubcategories
      });

      //create the categories in the map
      categoryMap.set(categoryData.id, {
        categoryId: categoryData.id,
        categoryName: categoryData.name,
        gameId: gameId,
        subcategories: subcategoryMap
      });
    });

    //convert Map<string, Map<string, CategoryViewModel>> to Map<string, CategoryViewModel[]>
    const convertedCategories = new Map<string, CategoryViewModel[]>();
    mappedCategoriesByGameId.forEach((categories, game) => {
      convertedCategories.set(game, Array.from(categories.values()).sort((a,b) => a.categoryName.localeCompare(b.categoryName)));
    });

    return {
      games: Array.from(mappedGamesByGameId.values()).sort((a,b) => a.gameName.localeCompare(b.gameName)),
      gameLookup: mappedGamesByGameId,
      categoriesByGameId: convertedCategories,
      runsByGameId: mappedRunsByGameId
    };
  };

  return useMemo(() => ({
    handleSearch,
    userId,
    runData
  }), [handleSearch, userId, runData]);
};

export type RunDataViewModel = {
  games: GameViewModel[];
  gameLookup: Map<string, GameViewModel>;
  //categories: CategoryViewModel[];
  categoriesByGameId: Map<string, CategoryViewModel[]>;
  //runs: RunViewModel[];
  runsByGameId: Map<string, RunViewModel[]>;
}

type GameViewModel = {
  gameId: string;
  gameName: string;
  gameUrl: string;
};

type CategoryViewModel = {
  categoryId: string;
  categoryName: string;
  gameId: string;
  subcategories: Map<string, SubcategoryViewModel>
};

type SubcategoryViewModel = {
  subcategoryId: string;
  subcategoryName: string;
  subcategoryValues: Map<string, SubcategoryValueViewModel>
};

type SubcategoryValueViewModel = {
  subcategoryValueId: string;
  subcategoryName: string;
}

type RunViewModel = {
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