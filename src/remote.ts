export const remote = {
  /* https://github.com/speedruncomorg/api/tree/master/version1 */
  speedrun: {
    getUser: async (userName: string) => { /* https://github.com/speedruncomorg/api/blob/master/version1/users.md#get-usersid */
      const response = await get<UserViewModel>(`https://www.speedrun.com/api/v1/users/${userName}`);
      return response;
    },
    getUserPersonalBests: async (userName: string) => { /* https://github.com/speedruncomorg/api/blob/master/version1/users.md#get-usersidpersonal-bests */
      const response = await get<PersonalBestsViewModel>(`https://www.speedrun.com/api/v1/users/${userName}/personal-bests?embed=game,category.variables`);
      return response.data;
    },
    getUserRunHistory: async (userId: string, gameId: string, categoryId: string) => { /* https://github.com/speedruncomorg/api/blob/master/version1/runs.md#get-runs */
      console.log("test");
      const response = await get<RunsViewModel>(`https://www.speedrun.com/api/v1/runs?user=${userId}&game=${gameId}&category=${categoryId}&embed=category.variables&max=200`);
      return response.data;
    },
  },
};

const get = async <TModel extends object>(url: string) => {
  const response = await fetch(url);
  const json = await response.json();
  return json as TModel;
};

type UserViewModel = {
  data: {
    id: string;
  };
};

type PersonalBestsViewModel = {
  data: PersonalBestViewModel[];
};

export type PersonalBestViewModel = {
  place: number;
  run: {
    category: string;
  } & BaseRunViewModel;
  game: {
    data: {
      id: string;
      names: {
        international: string;
        japanese: string;
        twitch: string;
      };
      weblink: string;
    };
  };
  category: CategoryViewModel;
};

type BaseRunViewModel = {
  id: string;
  weblink: string;
  game: string;
  level: string;
  times: {
    primary: string;
    primary_t: number;
    realtime: string;
    realtime_t: number;
    realtime_noloads: string;
    realtime_noloads_t: number;
    ingame: string;
    ingame_t: number;
  };
  values: object; //for the love of god why isn't this an array?
};

type CategoryViewModel = {
  data: {
    id: string;
    name: string;
    variables: {
      data: [
        {
          id: string;
          name: string;
          mandatory: boolean;
          values: {
            values: object; //for the love of god why isn't this an array?
          };
          "is-subcategory": boolean;
        }
      ];
    };
  };
};

type RunsViewModel = {
  data: RunViewModel[];
  //mapping this now in case I decide I ever want to show more than 200 runs in the history table
  pagination: {
    offset: number;
    max: number;
    size: number;
    links: [
      {
        rel: string;
        uri: string;
      }
    ];
  }
};

export type RunViewModel = {
  category: CategoryViewModel;
  status: {
    status: string;
    reason: string;
  };
  date: string;
} & BaseRunViewModel;