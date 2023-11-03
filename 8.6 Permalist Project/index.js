import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "root",
  port: 5432,
});

db.connect((err) => {
  if (err) {
    console.log("error in db", err);
  } else {
    console.log("connect successfully");
  }
});

let items = [
  { id: 1, title: "Dummy data" },
  { id: 2, title: "just add one item it will finish" },
];

app.get("/", async (req, res) => {
  try {
    const result = await db.query(`select * from items order by id desc`);
    if (result.rowCount !== 0) {
      items = result.rows;
    }
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  } catch (error) {
    res.send("error in '/': " + error);
    console.log("Error in '/': ", error);
  }
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  if (item) {
    //items.push({ title: item });
    try {
      const result = await db.query(`insert into items (title) values ($1)`, [
        item,
      ]);
    } catch (error) {
      console.log("error in add todo: ", error);
    }
  } else {
    res.send("please enter title");
  }
  res.redirect("/");
});

app.post("/edit", async (req, res) => {
  const getItemId = req.body.updatedItemId;
  const getTitleValue = req.body.updatedItemTitle;
  //console.log(getItemId, getTitleValue);
  try {
    if (getItemId && getTitleValue) {
      const result = await db.query(
        `update items set title = $1 where id = $2`,
        [getTitleValue, getItemId]
      );
      if (result.rowCount > 0) {
        //console.log(`rows updated: ${result.rowCount}`);
        res.redirect("/");
      }
    } else {
      res.send("problem in id and title of todo!");
    }
  } catch (error) {
    console.error("Error executing the query:", error);
    res.status(500).send("An error occurred.");
  }
});

app.post("/delete", async (req, res) => {
  const itemId = req.body.deleteItemId;
  if (itemId) {
    try {
      const result = await db.query(`delete from items where id = $1`, [
        itemId,
      ]);
      if (result.rowCount > 0) {
        res.redirect("/");
      }
    } catch (error) {
      console.log(`Error in delte: ${error}`);
    }
  } else {
    res.send(`delete item Id not found: ${itemId} `);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
