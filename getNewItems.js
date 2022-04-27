var ahData = require("./parseAhDataForServer.js");

// WARNING: WILL CAP YOUR BLIZZARD API USES FOR THE DAY IF YOU GET TOO MANY NEW ITEMS (3000+)
ahData.uniqueAuctionItems("Arthas", "en_GB", () => {
  console.log("Items update, complete!");
});
