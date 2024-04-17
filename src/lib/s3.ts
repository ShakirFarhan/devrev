import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as Config from '../config/index';
export const s3Client = new S3Client({
  region: Config.AWS_REGION as string,
  credentials: {
    accessKeyId: Config.AWS_ACCESS_KEY as string,
    secretAccessKey: Config.AWS_SECRET_ACCESS_KEY as string,
  },
});
