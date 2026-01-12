import { ObjectId } from 'mongodb';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import database from '../utils/db';
import redis from '../utils/redis';

const FolderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

exports.postUpload = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    name, type, parentId = 0, isPublic = false, data,
  } = req.body || {};

  if (!name) return res.status(400).json({ error: 'Missing name' });
  if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
  if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

  if (parentId !== 0) {
    const fileParent = await database.db.collection('files').findOne({ _id: new ObjectId(parentId) });

    if (!fileParent) return res.status(400).json({ error: 'Parent not found' });
    if (fileParent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
  }

  const file = {
    userId: new ObjectId(userId),
    name,
    type,
    isPublic,
    parentId: parentId === 0 ? 0 : new ObjectId(parentId),
  };
  if (type === 'folder') {
    const resultdb = await database.db.collection('files').insertOne(file);
    return res.status(201).json({
      id: resultdb.insertedId, userId, name, type, isPublic, parentId,
    });
  }

  if (!existsSync(FolderPath)) mkdirSync(FolderPath, { recursive: true });

  const pathLocal = path.join(FolderPath, randomUUID());

  const bufferFile = Buffer.from(data, 'base64');
  writeFileSync(pathLocal, bufferFile);

  file.pathLocal = pathLocal;

  const resultdb = await database.db.collection('files').insertOne(file);
  return res.status(201).json({
    id: resultdb.insertedId, userId, name, type, isPublic, parentId,
  });
};
