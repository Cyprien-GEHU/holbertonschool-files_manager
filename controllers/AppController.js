import redis from '../utils/redis';
import db from '../utils/db';

exports.getStatus = (req, res) => {
  const status = {
    redis: redis.isAlive(),
    db: db.isAlive(),
  };
  res.status(200).json(status);
};

exports.getStats = (req, res) => {
  const stats = {
    users: db.nbUsers(),
    files: db.nbFiles(),
  };
  res.status(200).json(stats);
};
