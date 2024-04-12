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
  }
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
    id: string;
    weblink: string;
    game: string;
    level: string;
    category: string;
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
  category: {
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
};