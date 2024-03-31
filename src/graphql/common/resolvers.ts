import { finished } from 'stream/promises';
import { SingleUploadPayload } from '../../utils/types';

const queries = {};
const mutations = {
  singleUpload: async (_: any, payload: SingleUploadPayload) => {
    console.log(payload);
    const { createReadStream, filename, mimetype, encoding } =
      await payload.file;
    const stream = createReadStream();
    const out = require('fs').createWriteStream('local-file-output.txt');
    stream.pipe(out);
    await finished(out);

    return { filename, mimetype, encoding };
  },
};
export const resolvers = { queries, mutations };
