import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "root",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 2;

let users = [];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries join users on users.id=users_id where users_id = $1 ",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
// get users
async function checkUsers() {
  try {
    const result = await db.query(`select * from users order by id asc`);

    users = result.rows; // update the global array
    return users.find((user) => user.id == currentUserId);
  } catch (error) {
    console.log("error in checkUser: ", error);
  }
}
app.get("/", async (req, res) => {
  try {
    const countries = await checkVisisted();
    const currentUser = await checkUsers();
    //console.log(countries, currentUser);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
    });
  } catch (error) {
    console.log(error);
  }
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await checkUsers();
  try {
    const resultSelect = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [input.toLowerCase()]
    );
    if (resultSelect.rowCount !== 0) {
      const getData = resultSelect.rows[0];
      const countryCode = getData.country_code;
      // console.log(getData.country_code);

      // check already country exist or not
      const checkCountry = await db.query(
        `select * from visited_countries where 
      upper(country_code) = $1 and users_id = $2`,
        [countryCode.toUpperCase(), currentUserId]
      );
      //console.log("countery already exist value: ", checkCountry.rowCount);
      if (checkCountry.rowCount !== 0) {
        const countries = await checkVisisted();
        res.render("index.ejs", {
          error: "country name already exist, try again!",
          countries: countries,
          total: countries.length,
          users: users,
          color: currentUser.color,
        });
      } else {
        await db.query(
          `insert into visited_countries (country_code,users_id) 
    values ($1,$2)`,
          [countryCode, currentUserId]
        );
        res.redirect("/");
      }
    } else {
      const countries = await checkVisisted();
      res.render("index.ejs", {
        error: "country name not exist, try again!",
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
      });
    }
  } catch (error) {
    res.send(error);
    console.log("eror in add country: ", error);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name;
  const color = req.body.color;

  try {
    // with the help of returnung key word we can get the access of all newly columns data
    //which inserted soon. returning * will bring all columns names with data
    const result = await db.query(
      `insert into users (name,color) 
    values ($1,$2) RETURNING id`,
      [name, color]
    );
    //console.log(result);

    // access the inserted rows Id
    const insertedId = result.rows[0].id;
    if (insertedId) {
      currentUserId = insertedId;
      res.redirect("/");
    } else {
      console.log("inserted row id not found");
    }
  } catch (error) {
    console.log("error in new family memeber: ", error);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
