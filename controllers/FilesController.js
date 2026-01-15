import { ObjectId } from 'mongodb';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import mime from 'mime-types';
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

exports.getShow = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const paramsId = req.params.id;
  let idObject;
  try {
    idObject = new ObjectId(paramsId);
  } catch (err) {
    res.status(404).json({ err: 'Not found' });
  }

  const file = await database.db.collection('files').findOne({ _id: idObject, userId: new ObjectId(userId) });
  if (!file) return res.status(404).json({ error: 'Not found' });

  return res.json({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

exports.getIndex = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const page = Number(req.query.page) || 0;
  const itemMax = 20;

  const check = { userId: new ObjectId(userId) };
  if (req.query.parentId !== undefined) {
    const { parentId } = req.query;
    check.parentId = parentId === '0' ? 0 : new ObjectId(parentId);
  }

  const files = await database.db.collection('files').aggregate([
    { $match: check },
    { $skip: page * itemMax },
    { $limit: itemMax },
  ]).toArray();

  const listFile = files.map((data) => ({
    id: data._id,
    userId: data.userId,
    name: data.name,
    type: data.type,
    isPublic: data.isPublic,
    parentId: data.parentId,
  }));

  return res.status(200).json(listFile);
};

exports.putPublish = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const paramsId = req.params.id;
  const putResult = await database.db.collection('files').findOneAndUpdate(
    { _id: new ObjectId(paramsId), userId: new ObjectId(userId) },
    { $set: { isPublic: true } },
    { returnDocument: 'after' },
  );

  if (!putResult.value) return res.status(404).json({ error: 'Not found' });

  const file = putResult.value;
  return res.status(200).json({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

exports.putUnpublish = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const paramsId = req.params.id;
  const putResult = await database.db.collection('files').findOneAndUpdate(
    { _id: new ObjectId(paramsId), userId: new ObjectId(userId) },
    { $set: { isPublic: false } },
    { returnDocument: 'after' },
  );

  if (!putResult.value) return res.status(404).json({ error: 'Not found' });

  const file = putResult.value;
  return res.status(200).json({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

exports.getFile = async (req, res) => {
  const paramsId = req.params.id;

  const file = await database.db.collection('files').findOne({ _id: new ObjectId(paramsId) });
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (!file.isPublic) {
    const token = req.header('X-Token');
    if (!token) return res.status(404).json({ error: 'Not found' });

    const userId = await redis.get(`auth_${token}`);
    if (!userId || userId !== file.userId.toString()) { return res.status(404).json({ error: 'Not found' }); }
  }

  if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

  if (!file.pathLocal) return res.status(404).json({ error: 'Not found' });

  const absoPath = path.resolve(file.pathLocal);
  if (!existsSync(absoPath)) return res.status(404).json({ error: 'Not found' });
  console.log('PATH:', absoPath, existsSync(absoPath));

  const mimeType = mime.lookup(file.name) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);

  try {
    return res.sendFile(absoPath);
  } catch (err) {
    console.error('Error sending file:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
