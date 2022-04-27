var https = require("https");
var r = require("./ccRest.js");
var fs = require("fs");
var config = require("./config/config.js");

const realmLastUpdateFileName = "lastUpdate.json";
const apiKey = config.apiKey.toString();

// using an apiKey from blizzard allows you to query their database.
// The format of the info sent back is JSON with a URL and LastUpdateTime
// Requesting data from the URL will give you a big JSON blob with two main parts,
// 		the realms it is for and then every auction which has some attributes.
// This function stores both the first and second JSON blobs to files
// Using the first we can know if we actually have to re-write a file, otherwise
// 		we can use the previous version and doesn't have to redownload/write the big blob.
// This function will return a realm, region and the filename for its JSON auction data
exports.updateServerAuctionData = function (realm, region, onFinish) {
  var options = setOptions(realm, region, apiKey);
  // call to get the first portion of JSON data from blizzard API
  r.getJSON(options, function (statusCode, result) {
    var obj = JSON.parse(JSON.stringify(result));
    var match = false;
    var writeUpdate = false;
    var url = obj.files[0].url; // auction data url

    console.log("statusCode: " + statusCode);
    if (statusCode !== 200) {
      return;
    }

    if (!checkIfRealmNeedsUpdate(obj, realm, region)) {
      onFinish("AH_DATA_" + realm + "_" + region + ".json");
      return;
    }

    var returnData = getRealmData(obj, url);
    match = returnData[0];
    writeUpdate = returnData[1];

    options = setOptionsForUrl(url);
    getRealmAuctionData(
      options,
      realm,
      region,
      match,
      writeUpdate,
      (filename) => {
        onFinish(filename);
      }
    );
  });
}; // module end

function setOptions(realm, region, apikey) {
  var options = {};
  if (region !== "en_US") {
    options = {
      host: "eu.api.battle.net", // note eu.api instead of us.api
      port: 443,
      path:
        "/wow/auction/data/" +
        realm +
        "?locale=" +
        region +
        "&apikey=" +
        apiKey,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  } else {
    options = {
      host: "us.api.battle.net",
      port: 443,
      path:
        "/wow/auction/data/" +
        realm +
        "?locale=" +
        region +
        "&apikey=" +
        apiKey,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
  return options;
}

function setOptionsForUrl(url) {
  var domain = extractDomain(url); // host
  var path = url.split(domain).pop(); // path

  options = {
    host: domain,
    port: 80,
    path: path,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  return options;
}

function checkIfRealmNeedsUpdate(obj, realm, region) {
  var lastMod = obj.files[0].lastModified;
  console.log(lastMod);
  var goTo = obj.files[0].url; // the URL provided for our JSON Blob

  if (fs.existsSync("AH_DATA_" + realm + "_" + region + ".json")) {
    // we have got data for this realm before
    // check previously stored update time for this realm
    var update = realmNeedsUpdate(goTo, lastMod);
    if (update === false) {
      console.log("LOG IS UP TO DATE!");
      return false; // we're done here
    }
  }
  return true;
}

function realmNeedsUpdate(url, lastMod) {
  if (fs.existsSync("lastUpdate.json")) {
    var data = fs.readFileSync(realmLastUpdateFileName, "utf8");
    var object = JSON.parse(data);

    for (
      i = 0;
      i < Object.keys(object).length;
      i++ // search if we have this object already
    ) {
      if (object[i].files[0].url === url) {
        // found a match
        if (object[i].files[0].lastModified === lastMod) {
          return false;
        }
      }
    }
    return true;
  }
  return true;
}

function getRealmData(obj, goTo) {
  // check to see if we already have seen this URL before
  var lastMod = obj.files[0].lastModified;
  var json = JSON.stringify(obj);
  var match = false;
  var writeUpdate = false;

  if (fs.existsSync("lastUpdate.json")) {
    fs.readFile(
      "lastUpdate.json",
      "utf8",
      function readFileCallback(err, data) {
        if (err) {
          console.log(err);
        } else {
          // PLACEHOLDER FOR var match = false;
          var object = JSON.parse(data);
          for (
            i = 0;
            i < Object.keys(object).length;
            i++ // search if we have this item already
          ) {
            if (object[i].files[0].url === goTo) {
              // found a match
              match = true;
              // we have this object already, let's update it's modified time
              if (object[i].files[0].lastModified !== lastMod) {
                writeUpdate = true;
                console.log("Time to update that lastModified attribute!");
                object[i].files[0].lastModified = lastMod;
                var j = JSON.stringify(object);
                fs.writeFileSync("lastUpdate.json", j, "utf8"); // deprecated b/c missing callback? changed to sync...
                break;
              }
            }
          }
          // not found, add it
          if (match === false) {
            console.log("I'm gonna add an item to our JSON updateList!");
            object.push(obj); // add our new found object to the array of json objects?
            var j = JSON.stringify(object);
            fs.writeFileSync("lastUpdate.json", j, "utf8");
          }
        }
      }
    );
  } else {
    // There is no lastUpdate.json file, let's make it!
    fs.writeFileSync("lastUpdate.json", "[" + json + "]", "utf8"); // make our file
  }
  var returnInfo = [match, writeUpdate];
  return returnInfo;
}

function getRealmAuctionData(
  options,
  realm,
  region,
  match,
  writeUpdate,
  callback
) {
  //subsequent call to get the big blob
  r.getJSON(options, function (statusCode, finalResult) {
    var filename = "AH_DATA_" + realm + "_" + region + ".json";
    var ahBlob = finalResult;
    console.log(statusCode);
    if (
      (statusCode === 200 && match === false) ||
      (statusCode == 200 && writeUpdate === true)
    ) {
      //console.log(ahBlob); // ZOMG what are you doing, this this is too big to print all of it!!!
      // Store the blob locally
      ahBlob = JSON.stringify(ahBlob);
      fs.writeFileSync(filename, ahBlob, "utf8");
      console.log("File Written!: " + filename);
      callback(filename);
    } else {
      callback(filename);
    }
  });
}

function extractDomain(url) {
  var domain;
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf("://") > -1) {
    domain = url.split("/")[2];
  } else {
    domain = url.split("/")[0];
  }

  //find & remove port number
  domain = domain.split(":")[0];

  return domain;
}
