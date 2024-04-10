export type UserViewModel = {
  data: {
    id: string;
  };
};

export type PersonalBestsViewModel = {
  data: Array<PersonalBestViewModel>;
};

export type PersonalBestViewModel = {
  place: number;
}

export const remote = {
  /* https://github.com/speedruncomorg/api/tree/master/version1 */
  speedrun: {
    getUser: async (userName: string) => { /* https://github.com/speedruncomorg/api/blob/master/version1/users.md#get-usersid */
      const response = await get<UserViewModel>(`https://www.speedrun.com/api/v1/users/${userName}`);
      return response;
    },
    getUserPersonalBests: async (userName: string) => { /* https://github.com/speedruncomorg/api/blob/master/version1/users.md#get-usersidpersonal-bests */
      const response = await get<PersonalBestsViewModel>(`https://www.speedrun.com/api/v1/users/${userName}/personal-bests?embed=game,category.variables`)
      return response;
    }
  }
};

const get = async <TModel extends object>(url: string) => {
  const response = await fetch(url);
  const json = await response.json();
  return json as TModel;
};
