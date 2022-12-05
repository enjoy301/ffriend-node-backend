const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/user", (req, res) => {
  connection.query(
    "SELECT count(*) FROM user where kakao_id=?",
    [req.body.kakaoId],
    (err, rows) => {
      if (err) throw err;
      if (rows[0]["count(*)"] === 0) {
        let uri = new Date().getTime().toString(36);
        connection.query(
          "INSERT INTO user (name, kakao_id, uri) VALUES (?, ?, ?)",
          [req.body.name, req.body.kakaoId, uri],
          (err, rows) => {
            if (err) throw err;
            res.send({
              uri: uri,
              kakaoId: req.body.kakaoId,
            });
          }
        );
      } else {
        connection.query(
          "SELECT uri from user where kakao_id=?",
          [req.body.kakaoId],
          (err, rows) => {
            if (err) throw err;
            res.send({
              uri: rows[0]["uri"],
              kakaoId: req.body.kakaoId,
            });
          }
        );
      }
    }
  );
});

app.get("/uri", (req, res) => {
  let kakaoId = req.query.kakaoId;
  connection.query(
    "SELECT uri from user where kakao_id=?",
    [kakaoId],
    (err, rows) => {
      if (err) throw err;
      res.send({
        uri: rows[0]["uri"],
      });
    }
  );
});

app.get("/data", (req, res) => {
  let uri = req.query.uri;
  let name = "";

  connection.query("SELECT name from user where uri=?", [uri], (err, rows) => {
    if (err) throw err;
    if (rows.length === 0) {
      res.status(404).send("Not Found");
    } else {
      name = rows[0]["name"];
    }
  });

  connection.query(
    "SELECT id, comment, thumbs from comment where uri=? order by thumbs desc",
    [uri],
    (err, rows) => {
      if (err) throw err;
      res.send({
        name: name,
        comments: rows,
      });
    }
  );
});

app.post("/comment", (req, res) => {
  let uri = req.body.uri;
  let comment = req.body.comment;

  connection.query(
    "INSERT INTO comment (uri, comment) VALUES (?, ?)",
    [uri, comment],
    (err, result) => {
      if (err) throw err;
      res.status(200).send({
        id: result.insertId,
      });
    }
  );
});

app.put("/thumbs", (req, res) => {
  let id = req.query.id;
  connection.query(
    "UPDATE comment SET thumbs = thumbs + 1 WHERE id=?",
    [id],
    (err, rows) => {
      if (err) throw err;
      res.status(200).send("OK");
    }
  );
});

app.delete("/comment", (req, res) => {
  let id = req.query.id;
  connection.query("DELETE FROM comment WHERE id=?", [id], (err, rows) => {
    if (err) throw err;
    res.status(200).send("OK");
  });
});

app.listen(3001, () => {
  console.log(`Example app listening on port 3001`);
});
