import database from '../utils/db';

const sha1 = require('js-sha1');

exports.postNew = async (req, res) => {
  const { email } = req.body;
  const { password } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });
  if (!password) return res.status(400).json({ error: 'Missing password' });

  const emailExist = await database.db.collection('users').findOne({ email });
  if (emailExist) return res.status(400).json({ error: 'Already exist' });

  const hashMdp = sha1(password);
  const PostUser = await database.db.collection('users').insertOne({ email, password: hashMdp });

  return res.status(201).json({ id: PostUser.insertedId, email });
};
