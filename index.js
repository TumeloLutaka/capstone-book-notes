import express from "express"
import axios from "axios"
import pg from "pg"
import bodyParser from "body-parser"
import "dotenv/config"
 
const { Pool } = pg;
 
const app = express();
const PORT = 3000;
 
const connectionString = "postgres://tumelo:hmxD4nJFBrIoRRthoDyp9LRtwf3sG9sN@dpg-co3kue21hbls73bjpntg-a.oregon-postgres.render.com/book_notes_jhsk";//you can create your postgreSQL server on render.com or Vercel and then they'll give u external URL copy that and paste it here
 
const db = new Pool({
  connectionString: connectionString,
  // If you're using a service like Heroku, you might need this for SSL:
  ssl: {
    rejectUnauthorized: false,
  },
});
db.connect();

// const db = new pg.Client({
//     user: process.env.POSTGRES_USER,
//     host: process.env.HOST_NAME,
//     database: process.env.DATABASE_NAME,
//     password: process.env.DATABASE_PASSWORD,
//     port: process.env.PORT_NUM
// })

// Installing middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"))

////////////////////////////// GET ROUTES //////////////////////////////

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM books")
    res.render("index.ejs", { books: result.rows})
})

app.get("/notes/:id", async (req, res) => {
    // Send book information to be rendered to the notes page
    const result = await db.query("SELECT * FROM books WHERE id=$1", [req.params.id])
    // Get notes to be rendered in notes list on book page.
    const resultNotes = await db.query("SELECT * FROM notes WHERE book_id=$1 ORDER BY created DESC;", [req.params.id])
    
    // Render notes page with postgres data
    res.render("notes.ejs", { book: result.rows[0], notes: resultNotes.rows})
})

////////////////////////////// POST ROUTES //////////////////////////////

app.post("/", async (req, res) => { 
    // Adding a new book to the postgres database.
    await db.query("INSERT INTO books (title, image_url, rating, description, date_read) VALUES ($1, $2, $3, $4, $5)", 
    [
        req.body.title,
        `https://covers.openlibrary.org/b/isbn/${ req.body.isbn.trim() }-M.jpg`,
        req.body.rating,
        req.body.description,
        req.body["date-read"]
    ])

    res.redirect(req.headers.referer)
})

app.post("/add-note", async (req, res) => {
    // Adding a new note to the corespongin book in the postgres database.
    await db.query("INSERT INTO notes (book_id, title, details) VALUES ($1, $2, $3)", 
    [
        req.body["book-id"],
        req.body.title,
        req.body.details
    ])

    res.redirect(req.headers.referer)
})

////////////////////////////// DELETE ROUTES //////////////////////////////

// Route for deleting an entire book's note
app.post("/delete-book/:id", async (req, res) => {
    await db.query("DELETE FROM books WHERE id=$1",[req.params.id])
    res.redirect(req.headers.referer)
    
})

// Route for deleting an entire book's note
app.post("/delete-note/:id", async (req, res) => {
    await db.query("DELETE FROM notes WHERE id=$1",[req.params.id])
    res.redirect(req.headers.referer)
    
})

////////////////////////////// EDIT ROUTES //////////////////////////////

// Route for editing the details of a book's note
app.post("/edit-note-details/:id", async (req, res) => {
    await db.query("UPDATE notes SET details=$1 WHERE id=$2",[req.body.details, req.params.id])
    res.redirect(req.headers.referer)
    
})

// Route for editing the title of a book's note
app.post("/edit-note-title/:id", async (req, res) => {
    await db.query("UPDATE notes SET title=$1 WHERE id=$2",[req.body.title, req.params.id])
    res.redirect(req.headers.referer)
    
})

app.listen(PORT, () => {
    console.log(`Running application on port: ${PORT}`)
})