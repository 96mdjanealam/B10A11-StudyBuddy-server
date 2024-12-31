require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();

const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://study-buddy-71834.web.app",
      "https://study-buddy-71834.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  // console.log("token inside the verifyTOken", token)

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  // verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorize access" });
    }
    req.user = decoded;
    next();
  });
};

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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const assignmentsCollection = client
      .db("studyBuddy")
      .collection("assignments");

    // auth related APIs
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

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
      const query = { pending: true };
      const result = await assignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/assignments-submitted", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = {};

      // console.log(req.cookies?.token)

      if (req.user.email !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      if (email) {
        query = { submittedBy: email };
      }
      const result = await assignmentsCollection.find(query).toArray();
      res.send(result);
    });

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
          nameSubmittedBy: req.body?.nameSubmittedBy,
        },
      };
      const result = await assignmentsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.patch("/assignment-evaluate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          pending: false,
          givenMark: req.body?.mark,
          feedback: req.body?.feedback,
        },
      };
      const result = await assignmentsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

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
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
