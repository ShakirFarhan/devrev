import { finished } from 'stream/promises';
import { File } from '../../utils/types';
import { uploadFileToS3 } from '../../services/s3';

const queries = {};
const mutations = {
  singleUpload: async (_: any, payload: { file: File }) => {
    const url = await uploadFileToS3(payload.file, 'test');
    console.log(url);

    return 'Hello';
  },
};
export const resolvers = { queries, mutations };
