import { getTimeDifference } from './utils/getTimeDifference';
import { Db, MongoClient, ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.MONGODB_URI || '';
const dbString = process.env.MONGODB_DB || '';
const client = new MongoClient(uri);

async function logProgress(workerIndex: number, progress: number) {
    console.log(`Worker ${workerIndex}: ${progress}%...`);
}

// async function createDocumentChunk(workerIndex: number, numberOfDocuments: number) {
//     const logTrigger = numberOfDocuments / 10;
//     const batchSize = Math.ceil(numberOfDocuments / 10);
//     const documents = [];
//     for (let i = 0; i < numberOfDocuments; i++) {
//         if ((i + 1) % logTrigger === 0) { // Check if it's time to log progress
//             await logProgress(workerIndex, Math.round(((i + 1) / numberOfDocuments) * 100));
//         }
//         documents.push({
//             _id: faker.string.uuid() as unknown as ObjectId,
//             id2: faker.string.uuid(),
//             id3: faker.string.uuid(),
//             id4: faker.string.uuid(),
//             payload: faker.string.alphanumeric({
//                 length: 4096
//             })
//         });
//     }

//     const db = client.db(dbString);
//     const collection = db.collection('data');
//     console.log(`Worker ${workerIndex} inserting ${documents.length} documents`);
//     await collection.insertMany(documents);
//     return documents;
// }

async function createDocumentChunk(workerIndex: number, numberOfDocuments: number) {
    const logTrigger = numberOfDocuments / 10;
    const batchSize = Math.ceil(numberOfDocuments / 10);
    const db = client.db(dbString);
    const collection = db.collection('data');
    for (let batchStart = 0; batchStart < numberOfDocuments; batchStart += batchSize) {
        const documents = [];
        const batchEnd = Math.min(batchStart + batchSize, numberOfDocuments);
        for (let i = batchStart; i < batchEnd; i++) {
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

        await collection.insertMany(documents);

        const progress = Math.round(((batchEnd) / numberOfDocuments) * 100);
        await logProgress(workerIndex, progress);
    }
}

export async function load() {
    const start = new Date();
    const documentTotal = process.env.NUMBER_OF_DOCUMENTS ? parseInt(process.env.NUMBER_OF_DOCUMENTS) : 0;
    const workerTotal = process.env.NUMBER_OF_WORKERS ? parseInt(process.env.NUMBER_OF_WORKERS) : 0;
    const documentsPerWorker = Math.floor(documentTotal / workerTotal);

    try {
        await client.connect(); // Connect to MongoDB

        const allBatches = Array.from({ length: workerTotal }, (_, i) => i).map(workerIndex => {
            return createDocumentChunk(workerIndex, documentsPerWorker); // Create and insert document chunks
        });

        await Promise.all(allBatches); // Wait for all workers to finish
    } catch (error) {
        console.error(error);
    } finally {
        await client.close(); // Close the MongoDB connection
    }

    const end = new Date();
    console.log(`Time taken ${getTimeDifference(start, end)}`);
}

load().catch(error => {
    console.error(error);
});