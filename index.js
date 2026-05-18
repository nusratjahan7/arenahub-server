const express = require('express');
const dotenv = require('dotenv');

const app = express();
const cors = require('cors');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)
const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const { payload } = await jwtVerify(token, JWKS);
        next();
    } catch (error) {
        console.log("JWT error:", error.message);
        return res.status(403).json({ message: "Forbidden" });
    }
}

async function run() {
    try {
        // await client.connect();
        const db = client.db('arenahub');
        const facilitiesCollection = db.collection('facilities');
        const bookingCollection = db.collection('bookings');

        app.get('/featured', async (req, res) => {
            const result = await facilitiesCollection.find().limit(6).toArray();
            res.send(result);
        })

        app.get('/facility', async (req, res) => {
            const { userId, search, type } = req.query;

            const query = {};

            if (userId) query.userId = userId;
            if (search) query.facilityName = { $regex: search, $options: 'i' };
            if (type) query.type = { $in: type.split(',') };

            console.log("mongo query:", JSON.stringify(query));

            const cursor = facilitiesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/facility/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const facility = await facilitiesCollection.findOne(query);
            res.send(facility);
        })

        app.post('/facility', verifyToken, async (req, res) => {
            const facilityData = req.body;
            const result = await facilitiesCollection.insertOne(facilityData);
            res.send(result);
        })

        app.patch('/facility/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const result = facilitiesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )
            res.send(result)
        })

        app.delete("/facility/:id", verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await facilitiesCollection.deleteOne({
                _id: new ObjectId(id),
            });
            res.json(result);
        });
        app.get('/booking/:userId', async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollection.find({ userId }).toArray();
            res.send(result);
        })

        app.post('/booking', async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result);
        })

        app.delete('/booking/:bookingId', verifyToken, async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingCollection.deleteOne({
                _id: new ObjectId(bookingId)
            })
            res.send(result);
        })


        // await client.db("admin").command({ ping: 1 });
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