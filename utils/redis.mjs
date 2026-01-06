import { promisify } from "util";
import redis from "redis";

class RedisClient {
    constructor() {
        this.client = redis.createClient();
        this.asyncMethod = promisify(this.client.get).bind(this.client);

        this.client.on('error', (err) => {
            console.log(`Redis client not connected to the server: ${err}`);
        })
    }

    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        const value = await this.asyncMethod(key);
        return value;
    }

    async set(key,duration, value) {
        this.client.setex(key, duration, value);
    }

    async del(key) {
        this.client.del(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;