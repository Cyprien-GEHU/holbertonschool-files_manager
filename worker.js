import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import database from './utils/db';

const fileQueue = new Queue('fileQueue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
});

fileQueue.process(async (task) => {
  const { userId, fileId } = task.data;
  if (!userId) throw new Error('Missing userId');

  if (!fileId) throw new Error('Missing fileId');

  const file = await database.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  if (!file) throw new Error('File not found');

  const sizeWidth = [500, 250, 100];

  await Promise.all(
    sizeWidth.map(async (size) => {
      const thumbnail = await imageThumbnail(file.pathLocal, {
        width: size,
        responseType: 'buffer',
      });

      const OutPath = `${file.pathLocal}_${size}`;

      await fs.writeFile(OutPath, thumbnail);
    }),
  );
});
