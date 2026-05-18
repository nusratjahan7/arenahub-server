const express = require('express');
const dotenv = require('dotenv');

const app = express();
const cors = require('cors');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        const db = client.db('arenahub');
        const facilitiesCollection = db.collection('facilities');

        app.get('/facility', async (req, res) => {
            const cursor = facilitiesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/facility/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const facility = await facilitiesCollection.findOne(query);
            res.send(facility);
        })

        app.post('/facility', async (req, res) => {
            const facilityData = req.body;
            const result = await facilitiesCollection.insertOne(facilityData);
            res.send(result);
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is Serving')
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})