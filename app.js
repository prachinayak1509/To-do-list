//jshint esversion: 6

const express = require("express");
const serverless = require("serverless-http");
const bodyparser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://prachinayak1509:swapnil17@ac-ffahjb2-shard-00-00.imiaiil.mongodb.net:27017,ac-ffahjb2-shard-00-01.imiaiil.mongodb.net:27017,ac-ffahjb2-shard-00-02.imiaiil.mongodb.net:27017/?ssl=true&replicaSet=atlas-xsbklp-shard-0&authSource=admin&retryWrites=true&w=majority", {
  useNewUrlParser: true,
  dbName: "testDB"
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "welcome to to do list",
});

const item2 = new Item({
  name: "Hit + button to create a new item",
});

const item3 = new Item({
  name: "< -- hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  //sending data from server to browser
  let day = date.getDate();

  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("succesfully saved");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "day", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });

  /*res.render("list", {
    listTitle : day,
    newListItems: items
  });
*/
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName); //lodash capatalize func will make first letter uppercase and others lowercase
  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  let itemName = req.body.newItem;
  const listName = req.body.list;
  let day = date.getDate();

  const item = new Item({
    name: itemName,
  });

  if (listName === day) {
    item.save();
    res.redirect("/"); //so that new item shows up on localhost
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  /*if (req.body.list === "Work") {
    workItems.push(item);
    res.redirect("/work");
  } else {
    items.push(item);
    res.redirect("/");
  }*/
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  let day = date.getDate();

  if (listName === day) {
    //coming from default list
    Item.deleteOne({ _id: checkedItemId })
      .then(() => {
        console.log("successfully deleted");
      })
      .catch((err) => {
        console.log(err);
      });
    res.redirect("/"); // so that local host redirected to home page
  } else {
    //coming from custom list
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/work", function (req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems,
  });
});

app.post("/work", function (req, res) {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

app.listen(3000, function () {
  console.log("listening on port 3000!");
});

app.use("/.netify/functions/api",router);
module.exports.handler = serverless(app);