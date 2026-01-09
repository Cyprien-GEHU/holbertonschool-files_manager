import pkg from "mongodb";

const { MongoClient } = pkg;

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || "27017";
const database = process.env.DB_DATABASE || "files_manager";
const uri = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.connected = false;

    this.client
      .connect()
      .then(() => {
        this.connected = true;
        this.db = this.client.db(database);
      })
      .catch((err) => {
        this.connected = false;
        console.log(err)
      })
  }

  isAlive() {
    return this.connected
  }

  async nbUsers() {
    if (!this.db) {
      return 0
    }
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.db) {
      return 0
    }
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;