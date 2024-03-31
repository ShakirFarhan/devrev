import * as Config from '../config/index';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: Config.AWS_REGION as string,
  credentials: {
    accessKeyId: Config.AWS_ACCESS_KEY as string,
    secretAccessKey: Config.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const uploadToS3 = async (key: string, body: string) => {
  const command = new PutObjectCommand({
    Bucket: Config.AWS_BUCKET,
    Key: key,
    Body: body,
  });

  await s3Client.send(command);
};
