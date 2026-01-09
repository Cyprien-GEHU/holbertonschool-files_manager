import redis from '../utils/redis';
import db from '../utils/db';

exports.getStatus = (req, res) => {
  const status = {
    redis: redis.isAlive(),
    db: db.isAlive(),
  };
  res.status(200).json(status);
};

exports.getStats = async (req, res) => {
  const stats = {
    users: await db.nbUsers(),
    files: await db.nbFiles(),
  };
  res.status(200).json(stats);
};
