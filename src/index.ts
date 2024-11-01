import { faker } from '@faker-js/faker';
import dotenv from 'dotenv'
import { getTimeDifference } from './utils/getTimeDifference';
import { Db, MongoClient, ObjectId } from 'mongodb';

dotenv.config();
const uri = process.env.MONGODB_URI || '';
const dbString = process.env.MONGODB_DB || '';
const client = new MongoClient(uri);

function logProgress(workerIndex: number, progress: number) {
    console.log(`Worker ${workerIndex}: ${progress}%...`);
}

export async function createDocumentChunk(workerIndex: number, numberOfDocuments: number) {
    const logTrigger = numberOfDocuments / 10;
    const documents = [];
    for (let i: number = 0; i < numberOfDocuments; i++) {
        if ((i + 1) % logTrigger === 0) { // Check if it's time to log progress
            logProgress(workerIndex, Math.round(((i + 1) / numberOfDocuments) * 100));
        }
        documents.push({
            _id: faker.string.uuid() as unknown as ObjectId,
            id2: faker.string.uuid(),
            id3: faker.string.uuid(),
            id4: faker.string.uuid(),
            payload: faker.string.alphanumeric({
                length: 4096
            })
        });
    }

    const db = client.db(dbString);
    const collection = db.collection('data');
    await collection.insertMany(documents);
    return documents
}

export async function load() {
    const start = new Date();
    const documentTotal = process.env.NUMBER_OF_DOCUMENTS ? parseInt(process.env.NUMBER_OF_DOCUMENTS) : 0;
    const workerTotal = process.env.NUMBER_OF_WORKERS ? parseInt(process.env.NUMBER_OF_WORKERS) : 0;
    const documentsPerWorker = Math.floor(documentTotal / workerTotal);

    try {
        const allBatches = Array.from({ length: workerTotal }, (_, i) => i).map(async workerIndex => {
            return createDocumentChunk(workerIndex, documentsPerWorker);
        });

        await Promise.all(allBatches);
    } catch (error) {
        console.error(error);
    }

    const end = new Date();
    console.log(`Time taken ${getTimeDifference(start, end)}`);
}

load().catch(error => {
    console.error(error);
});
