var getData = require("./getAhDataForServer.js");
var getItemData = require("./getItemNameForId.js");
var fs = require("fs");
var table = require("text-table");
var _ = require("lodash");
var padStart = require("lodash.padstart");
var where = require("lodash.where");
var _filter = require("lodash.filter");
var _isEqual = require("lodash.isequal");

// general outline of how a function will look
// exports.getAuctionData = function(itemName, realm, region, callback) // wrapper
// {
// 	update(realm, region, (obj) => {

// 	});
// }

// listAllItemsOfOwner('Cc', 'Ysondre', 'en_US', (dict) => {
// 	for(var key in dict)
// 	{
// 		var value = dict[key];
// 		console.log('Cc'+" has "+value+" posts of " +key+"!");
// 	}
// });

// uniqueAuctionItems('Ysondre', 'en_GB', (dict) => {
// 	return;
// });

// undercut('Cc', 'Ysondre', 'en_US', (dict) => {
// 	return;
// });

// listAllItemsOfOwner('Cc', 'Ysondre', 'en_US', (string) => {
// 	console.log(string);
// });

// topPosters('Ysondre', 'en_US', (string) => {
// 	console.log(string);
// });

// returns a json object of AH Data of the specified realm and region
function update(realm, region, callback) {
  getData.updateServerAuctionData(realm, region, (filename) => {
    console.log(
      "Log updated for " + realm + "-" + region + " with filename: " + filename
    );

    fs.readFile(filename, "utf8", function doneReadingFile(err, data) {
      if (err) {
        console.log(err);
      } else {
        callback(JSON.parse(data));
      }
    });
  });
}

// returns a string of AH data in table format
exports.queryForItem = function (itemName, realm, region, callback) {
  update(realm, region, (obj) => {
    // convert string to item id by requesting it from our cache,
    var id = getItemFromCache(itemName);
    console.log("The id we found for " + itemName + " is: " + id);
    // if not in the cache, make a call to blizzard item API,
    if (id === undefined) {
      callback(
        "Sorry the requested item couldn't be found, please check your spelling and try again (not case sensitive)."
      );
      return;
    }

    var items = [];
    var filteredItems = where(obj.auctions, { item: Number(id) }); // get an array of json lines the given id
    //console.log(filteredItems);
    for (
      i = 0;
      i < filteredItems.length;
      i++ // going over only those lines with id
    ) {
      var auction = filteredItems[i];
      var pricePerItem = Math.round(auction.buyout / auction.quantity);
      items.push([
        auction.item,
        pricePerItem,
        auction.quantity,
        auction.buyout,
        auction.owner,
      ]);
    }

    // sort the posts by cheapest pricePerUnit first then by quanity
    // Sort the array based on the second element
    items.sort(function (first, second) {
      return first[1] - second[1] || second[2] - first[2];
    });

    const count = (items) =>
      items.reduce((a, b) => Object.assign(a, { [b]: (a[b] || 0) + 1 }), {});

    //console.log(count(items));
    var num = 0; // lets print the first 10 only
    var stringArray = [];
    //console.log("Price/Unit "+" Stack size "+" Buyout price "+" Seller "+" Posts ");
    stringArray.push([" #", "Each", "Qty", "Buyout", "Seller"]);
    for (key in count(items)) {
      if (num > 10) {
        break;
      }
      var keyArrayValues = key.split(",");
      if (Number(keyArrayValues[3]) === 0) {
        continue;
      }
      if (num % 2 === 0) {
        stringArray.push([
          "." + count(items)[key],
          formatCurrency(keyArrayValues[1]),
          keyArrayValues[2],
          formatCurrency(keyArrayValues[3]),
          keyArrayValues[4],
        ]);
      } else {
        stringArray.push([
          "`" + count(items)[key],
          formatCurrency(keyArrayValues[1]),
          keyArrayValues[2],
          formatCurrency(keyArrayValues[3]),
          keyArrayValues[4] + "'",
        ]);
      }
      num++;
    }
    var t = table(stringArray, { align: ["l", "r", "r", "r", "l"] });
    console.log(
      "```AsciiDoc\n" + itemName + " " + obj.realms[0].name + "\n" + t + "\n```"
    );
    callback(
      "```AsciiDoc\n" +
        "[" +
        itemName +
        " " +
        obj.realms[0].name +
        "]" +
        "\n" +
        t +
        "\n```"
    );
    //console.log(items);
    // perhaps inform when the data was last updated? hmm.. I would if I understood the format for lastModified!!
  });
};

// returns a number for how many auctions an owner has
exports.numOfAuctionsForOwner = function (owner, realm, region, callback) {
  update(realm, region, (obj) => {
    owner = toTitleCase(owner); // correctly format the name
    var filteredItems = where(obj.auctions, { owner: owner }); // get an array of json lines the given id
    callback(filteredItems.length);
  });
};

// returns a string in table format # of posts : item for a specific owner
exports.listAllItemsOfOwner = function (owner, realm, region, callback) {
  update(realm, region, (obj) => {
    owner = toTitleCase(owner); // correctly format the name
    var filteredItems = where(obj.auctions, { owner: owner }); // get an array of json lines the given id

    var idDict = {};
    for (var i = 0; i < Object.keys(filteredItems).length; i++) {
      var itemNumberKey = filteredItems[i].item;
      if (!idDict[itemNumberKey]) {
        idDict[itemNumberKey] = 1; // adding item
      } else {
        idDict[itemNumberKey]++;
      }
    }

    // conversion to real name instead of id number
    var dict = getItemData.getItemForIdDict(idDict);
    var finalDict = {};
    for (var key in dict) {
      finalDict[dict[key]] = idDict[key];
    }

    var stringArray = [];
    //console.log("Price/Unit "+" Stack size "+" Buyout price "+" Seller "+" Posts ");
    var num = 0;
    var conditionallyNumbersome = "";
    stringArray.push([" #", "Item"]);
    for (key in finalDict) {
      if (num > 50) {
        conditionallyNumbersome = "50/";
        break;
      }
      if (num % 2 === 0) {
        value = finalDict[key];
        stringArray.push(["." + value, key]);
      } else {
        value = finalDict[key];
        stringArray.push(["`" + value, key + "'"]);
      }
      num++;
    }

    var t = table(stringArray, { align: ["l", "l"] });
    callback(
      "```AsciiDoc\n" +
        "[" +
        owner +
        " " +
        obj.realms[0].name +
        "'s posts (" +
        conditionallyNumbersome +
        Object.keys(finalDict).length +
        " items):]" +
        "\n" +
        t +
        "\n```"
    );
    //callback(finalDict);
  });
};

// returns a table of items that the owner is selling that are undercut.
exports.undercut = function (owner, itemName, realm, region, callback) {
  var name = toTitleCase(owner);
  update(realm, region, (obj) => {
    var list = [];
    var filteredItems = [];

    if (itemName !== "") {
      console.log(itemName);
      filteredItems = where(obj.auctions, {
        owner: name,
        item: Number(getItemFromCache(itemName)),
      });
    } else {
      filteredItems = where(obj.auctions, { owner: name });
    }

    if (filteredItems.length === 0) {
      callback(
        "Couldn't find that person/item, check your spelling or try a different person/item."
      );
      return;
    }

    for (var i = 0; i < Object.keys(filteredItems).length; i++) {
      var item = filteredItems[i].item;
      var owner = filteredItems[i].owner;
      var price = filteredItems[i].buyout;
      var quantity = filteredItems[i].quantity;
      var pricePerItem = Math.round(
        filteredItems[i].buyout / filteredItems[i].quantity
      );

      // look at all of the owners auctions and find other auctions of the same item but with a lower price.
      var undercut = _filter(obj.auctions, function (o) {
        return (
          o.item === item &&
          o.owner !== owner &&
          o.buyout !== 0 &&
          Math.round(o.buyout / o.quantity) < pricePerItem &&
          o.quantity === quantity
        );
      });

      if (undercut.length > 0) {
        var num = 0;
        var average = 0;
        for (var k = 0; k < undercut.length; k++) {
          var oPricePerItem = Math.round(
            undercut[k].buyout / undercut[k].quantity
          );
          average += pricePerItem - oPricePerItem;
          num++;
        }
        average /= num;
        if (getItemNameFromCache(item) === undefined) {
          continue;
        }
        list.push([
          num,
          formatCurrency(Math.round(average)),
          getItemNameFromCache(item) + ` [${quantity}]`,
        ]); // add our item to a list
      }
    }
    newList = _.uniqWith(list, _isEqual);
    //callback(newList);

    // Sort the array based on the third element
    newList.sort(function (first, second) {
      if (first[2] < second[2]) {
        return -1;
      }
      if (first[2] > second[2]) {
        return 1;
      }
      return 0;
    });
    //console.log(newList);

    // make a table
    var stringArray = [];
    var conditionallyNumbersome = "";
    stringArray.push([" #", "by", "Item [stacksize]"]);
    for (var v = 0; v < newList.length; v++) {
      if (v > 40) {
        conditionallyNumbersome = "40/";
        break;
      }
      if (v % 2 === 0) {
        newList[v][0] = "." + newList[v][0];
        stringArray.push(newList[v]);
      } else {
        newList[v] = ["`" + newList[v][0], newList[v][1], newList[v][2] + "'"];
        stringArray.push(newList[v]);
      }
    }
    var t = table(stringArray, { align: ["l", "r", "l"] });
    callback(
      "```AsciiDoc\n" +
        "[" +
        name +
        " " +
        obj.realms[0].name +
        "'s list of " +
        conditionallyNumbersome +
        newList.length +
        " undercut item(s):]" +
        "\n" +
        t +
        "\n```"
    );
  });
};

// returns how many auctions are posted on a realm
exports.numOfAuctions = function (realm, region, callback) {
  update(realm, region, (obj) => {
    callback(Object.keys(obj.auctions).length);
  });
};

// returns the top 10 posters for a realm (quantity, not based on unqiue items posted)
exports.topPosters = function (realm, region, callback) {
  update(realm, region, (obj) => {
    var dict = {};
    for (
      i = 0;
      i < Object.keys(obj.auctions).length;
      i++ //Object.keys(obj.auctions).length  // Goes through every auction item
    ) {
      var key = obj.auctions[i].owner;
      var value = dict[key];
      if (!dict[key]) {
        dict[key] = 1;
      } else {
        dict[key]++;
      }
    }

    // dictionary -> array
    var items = Object.keys(dict).map(function (key) {
      return [key, dict[key]];
    });

    // Sort the array based on the second element
    items.sort(function (first, second) {
      return second[1] - first[1];
    });

    // Create a new array with only the first 10 items
    items = items.slice(0, 10);
    items.shift(["Posts", "Auctioneer"]);
    var t = table(items, { align: ["l", "l"] });
    callback(
      "```AsciiDoc\n" +
        "[Top posters for " +
        obj.realms[0].name +
        " are:]" +
        "\n" +
        t +
        "\n```"
    );
  });
};

// currently adds new item id to item name mappings
exports.uniqueAuctionItems = function (realm, region, callback) {
  update(realm, region, (obj) => {
    var dict = {};
    for (
      i = 0;
      i < Object.keys(obj.auctions).length;
      i++ // Goes through every auction item
    ) {
      var itemNumberKey = obj.auctions[i].item;
      if (!dict[itemNumberKey]) {
        dict[itemNumberKey] = 1; // adding item
      } else {
        dict[itemNumberKey]++;
      }
    }

    var dicto = getItemData.getItemForIdDict(dict);
    callback(dicto);

    // // everything after this is only usefull if we want to find the X most popular items.
    // // If we just want ALL the items we should just pass 'dict' into getItemForIdDict instead.
    // var items = Object.keys(dict).map(function(key) {
    //     return [key, dict[key]];
    // });

    // // Sort the array based on the second element
    // items.sort(function(first, second) {
    //     return second[1] - first[1];
    // });

    // console.log("There are "+ items.length + " unique items on the auction house");
    // //var items = items.slice(0, 4500); // Create a new array with only the first 4500 items

    // var sortedDict = {};
    // for(i = 0; i < items.length; i++){
    // 	var key = items[i][0] // item[i][0] is the item id
    // 	sortedDict[key] = items[i][1]; // item[i][1] is how many posts are for that item
    // }
    // console.log("But we're only interested in the first: " + items.length);
    // var dicto = getItemData.getItemForIdDict(sortedDict);
    // // var dict = getItemData.getItemForIdDict(idDict);
    // callback(sortedDict); // a dictionary of item ids : how many of that item are posted
  });
};

// returns an item id or undefined if not found
function getItemFromCache(itemName) {
  var id = undefined;
  if (fs.existsSync("itemNames.json")) {
    var data = fs.readFileSync("itemNames.json", "utf8");

    var object = JSON.parse(data);
    for (
      i = 0;
      i < Object.keys(object).length;
      i++ // search if we have this object already
    ) {
      if (object[i].name.toLowerCase() === itemName.toLowerCase()) {
        // we have this item already, let's return it
        id = object[i].id;
        console.log("Item found in cache, returning it! " + object[i].name);
        break;
      }
    }
  } else {
    // no cache!?
    console.log("No cache found?!?!!");
  }
  return id;
}

// given an item id returns the corresponding item name if it's in our cache.
function getItemNameFromCache(id) {
  if (fs.existsSync("itemNames.json")) {
    var data = fs.readFileSync("itemNames.json", "utf8");
    var object = JSON.parse(data);

    var filteredItems = where(object, { id: `${id}` }); // get an array of json lines the given id
    if (filteredItems.length > 0) {
      console.log(
        "Item found in cache, returning it! " + filteredItems[0].name
      );
      var item = {
        id: id,
        name: filteredItems[0].name,
      };
      //console.log("Adding "+id+" "+obj.name+" to itemList");
      return filteredItems[0].name;
    }
  }
  return undefined;
}

function isEmptyObject(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
}

function formatCurrency(x) {
  let c = x % 100;
  let s = ((x - c) % 10000) / 100;
  let g = (x - 100 * s - c) / 10000;
  if (g < 1) {
    if (s < 1) {
      return `${c}c`;
    }
    return `${s}s`;
  }
  return `${g}g`;
  //return `${g}g ${padStart(s,2,"0")}s ${padStart(c,2,"0")}c`;
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
