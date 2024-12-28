const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mqmjq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const assignmentsCollection = client
      .db("studyBuddy")
      .collection("assignments");

    app.post("/createAssignment", async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentsCollection.insertOne(newAssignment);
      res.send(result);
    });

    app.get("/allAssignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    app.get("/assignments/pending", async (req, res) => {
      const query = { pending:true };
      const result = await assignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/assignments-submitted", async(req, res)=>{
      const email = req.query.email;
      let query = {};
      if(email){
        query = {submittedBy: email};
      }
      const result = await assignmentsCollection.find(query).toArray();
      res.send(result)
    })

    app.patch("/assignment-update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: req.body?.title,
          image: req.body?.image,
          description: req.body?.description,
          marks: req.body?.marks,
          difficulty: req.body?.difficulty,
          date: req.body?.date,
          userName: req.body?.userName,
          email: req.body?.email,
        },
      };
      const result = await assignmentsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/assignment-submit/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          submission: req.body?.submission,
          notes: req.body?.notes,
          pending: req.body?.pending,
          submittedBy: req.body?.submittedBy,
          nameSubmittedBy:req.body?.nameSubmittedBy,
        },
      };
      const result = await assignmentsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/assignment-evaluate/:id",async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          pending:false,
          givenMark:req.body?.mark,
          feedback:req.body?.feedback,
        }
      };
      const result = await assignmentsCollection.updateOne(query, updateDoc);
      res.send(result);
    })

    app.delete("/assignment-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is douraitese");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});