const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// console.log(process.env.ACCESS_TOKEN);

app.use(express.json());
app.use(cors());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(403).send({ error: 1, message: 'unauthorized access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: 1, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    });
}


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.iipillt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const packageCollections = client.db('home-scissors').collection('package-collections');
        const bookingCollections = client.db('home-scissors').collection('booking-collections');

        app.get('/packages', async (req, res) => {
            const query = {};
            const packages = await packageCollections.find(query).toArray();
            res.send(packages);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            // const decoded = req.decoded;
            // if (req.query?.email !== decoded?.email) {
            //     return res.status(401).send({ error: 1, message: 'forbidden access' });
            // }

            let query = {};
            if (req.query?.email) {
                query = {
                    customer_email: req.query.email
                }
            }
            const result = await bookingCollections.find(query).toArray();
            res.send(result);
        });

        app.get('/package/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packageCollections.findOne(query);
            res.send(result);
        });

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })

        app.post('/bookings', async (req, res) => {
            const query = req.body;
            const result = await bookingCollections.insertOne(query);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    status: status
                },
            };
            const result = await bookingCollections.updateOne(query, updateDoc);
            res.send(result);
        })

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollections.deleteOne(query);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})