import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import database from '../utils/db';
import redis from '../utils/redis';

exports.postNew = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });
  if (!password) return res.status(400).json({ error: 'Missing password' });

  const emailExist = await database.db.collection('users').findOne({ email });
  if (emailExist) return res.status(400).json({ error: 'Already exist' });

  const hashMdp = crypto.createHash('sha1').update(password).digest('hex');
  const PostUser = await database.db.collection('users').insertOne({ email, password: hashMdp });

  return res.status(201).json({ id: PostUser.insertedId, email });
};

exports.getMe = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await await database.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json({ id: user._id, email: user.email });
};
