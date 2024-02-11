const queries = {
  getUser: (_: any, payload: any) => {
    return 'Hello';
  },
};
const mutations = {
  createUser: (_: any, payload: string) => {
    return '';
  },
};
export const resolvers = { queries, mutations };
