export type UserViewModel = {
  data: {
    id: string;
  };
};

export type RunsViewModel = {
  data: {
    id: string;
  }
};

export const remote = {
  speedrun: {
    getUser: async (userName: string) => {
      const response = await get<UserViewModel>(`https://www.speedrun.com/api/v1/users/${userName}`);
      return response;
    },
    getUserRuns: async (userId: string) => {
      const response = await get<RunsViewModel>(`https://www.speedrun.com/api/v1/runs?user=${userId}}`)
      return response;
    }
  }
};

const get = async <TModel extends object>(url: string) => {
  const response = await fetch(url);
  const json = await response.json();
  return json as TModel;
};
