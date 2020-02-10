var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3005;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


app.get("/scrape", function (req, res) {
  db.Article.remove()
    .then(function (dbArticle) {
      console.log(dbArticle);
    })
    .catch(function (err) {
      console.log(err);
    });
  axios.get("https://www.ted.com/talks").then(function (response) {
    var $ = cheerio.load(response.data);
    // console.log(response.data);

    // $("div.talk-link").each(function (i, element) {
    // var speakerName = $(element).children().children().children("h4.talk-link__speaker").text();
    // var titleName = $(element).children().children().children("h4").children("a").text();
    // var urlPath = $(element).children().children().children("h4").children("a").attr("href");
    // var imgSrc = $(element).children().children("div.talk-link__image").children().children("span.thumb").children("span.thumb__sizer").children("span.thumb__tugger").children("img").attr("src");

    // console.log(imgSrc);
    // });


    $("div.talk-link").each(function (i, element) {
      var result = {};

      // console.log("ELEMENT:\n" + $(element))


      result.speaker = $(element).children().children().children("h4.talk-link__speaker").text();
      result.title = $(element).children().children().children("h4").children("a").text();
      result.url = "https://www.ted.com" + $(element).children().children().children("h4").children("a").attr("href");
      result.img = $(element).children().children("div.talk-link__image").children().children("span.thumb").children("span.thumb__sizer").children("span.thumb__tugger").children("img").attr("src");

      console.log(result);
      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
});
