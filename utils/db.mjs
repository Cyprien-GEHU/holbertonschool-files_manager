import { MongoClient } from "mongodb";

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || "27017";
const database = process.env.DB_DATABASE || "files_manager";
const link = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.connected = false;
    this.client = new MongoClient(link, { useUnifiedTopology: true });

    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        this.connected = true;
      })
      .catch(() => {
        this.connected = false;
      })
  }

  isAlive() {
    return this.connected
  }

  async nbUsers() {
    if (!this.connected) {
      return 0
    }
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.connected) {
      return 0
    }
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;