import pg from "pg";
import "dotenv/config";

const db = new pg.Client({
  user: process.env.USER_NAME,
  host: process.env.HOST_NAME,
  database: process.env.DATA_BASE,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.log("error in db", err);
  } else {
    console.log("connect successfully");
    //testGetFlags();
    //getFlags();
  }
});

export async function getFlags() {
  try {
    const result = await db.query("SELECT * FROM flags");
    //console.log(result.rows);
    return result.rows; // Return the rows from the query result
  } catch (error) {
    console.error("Error executing query", error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    db.end(); // Ensure you close the database connection
  }
}

// Function to test getFlags within the same file
// async function testGetFlags() {
//   try {
//     const res = await getFlags();
//     console.log(res);
//   } catch (error) {
//     console.error("Error testing getFlags:", error);
//   }
// }
