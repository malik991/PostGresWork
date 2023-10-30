import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  password: "root",
  host: "localhost",
  database: "world",
  port: 5432,
});

db.connect((err) => {
  if (err) console.log("Error in DB connection");
  else console.log("successfully connected");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  try {
    const result = await db.query("select * from visited_countries");
    let countries = [];
    for (let i = 0; i < result.rows.length; i++) {
      countries.push(result.rows[i].country_code);
    }
    return countries;
  } catch (error) {
    console.log("Error in check visted function: ", error);
  }
}
app.get("/", async (req, res) => {
  //Write your code here.
  const countries = await checkVisited();
  res.render("index.ejs", { countries: countries, total: countries.length });
  //db.end();
  //console.log(countries);
});

app.post("/add", async (req, res) => {
  try {
    const resultSelect = await db.query(
      `select country_code from 
      countries where country_name = $1
    `,
      [req.body.country]
    );
    if (resultSelect.rowCount !== 0) {
      const getData = resultSelect.rows[0];
      const countryCode = getData.country_code;
      // console.log(getData.country_code);

      // check already country exist or not
      const checkCountry = await db.query(
        `select * from visited_countries where 
      upper(country_code) = $1`,
        [countryCode.toUpperCase()]
      );
      console.log("countery already exist value: ", checkCountry.rowCount);
      if (checkCountry.rowCount !== 0) {
        const countries = await checkVisited();
        res.render("index.ejs", {
          error: "country name already exist, try again!",
          countries: countries,
          total: countries.length,
        });
      } else {
        await db.query(
          `insert into visited_countries (country_code) 
    values ($1)`,
          [countryCode]
        );
        res.redirect("/");
      }
    } else {
      const countries = await checkVisited();
      res.render("index.ejs", {
        error: "country name not exist, try again!",
        countries: countries,
        total: countries.length,
      });
    }
  } catch (error) {
    res.send(error);
    console.log("eror in post: ", error);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
