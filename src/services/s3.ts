import * as Config from '../config/index';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs, { ReadStream } from 'fs';
import { s3Client } from '../lib/s3';
// import {  } from '@aws-sdk/client-s3';
import { File } from '../utils/types';
import { Upload } from '@aws-sdk/lib-storage';
export const uploadFileToS3 = async (file: File, key: string) => {
  try {
    const inputFile = await file;
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: Config.AWS_BUCKET,
        Key: key,
        Body: inputFile.createReadStream(),
        ContentType: inputFile.mimetype,
      },
    });
    const url = await upload.done();
    return url.Location;
  } catch (error) {
    console.log('Error while uploading file to s3');
    console.log(error);
  }
};

export const deleteFileFromS3 = async (key: string) => {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: Config.AWS_BUCKET,
      Key: key,
    });
    await s3Client.send(deleteCommand);
    console.log('File deleted Successfully..');
  } catch (error) {
    console.log('Error while deleting file to s3');
    console.log(error);
  }
};
