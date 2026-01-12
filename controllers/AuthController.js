import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import database from '../utils/db';
import redis from '../utils/redis';

exports.getConnect = async (req, res) => {
  const authorization = req.header('authorization');

  if (!authorization) return res.status(401).json({ error: 'Unauthorized' });

  const Base64 = authorization.split(' ')[1];
  const [email, password] = Buffer.from(Base64, 'base64').toString('utf-8').split(':');

  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const hashMdp = crypto.createHash('sha1').update(password).digest('hex');
  const user = await database.db.collection('users').findOne({ email, password: hashMdp });

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const token = uuidv4();
  await redis.set(`auth_${token}`, user._id.toString(), 24 * 3600);
  return res.status(200).json({ token });
};

exports.getDisconnect = async (req, res) => {
  const token = req.header('X-Token');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const userId = await redis.get(`auth_${token}`);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await redis.del(`auth_${token}`);
  return res.status(204).send();
};
