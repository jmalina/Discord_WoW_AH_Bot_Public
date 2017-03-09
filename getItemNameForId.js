var https = require('https');
var r = require('./ccRest.js');
var fs = require('fs');
var where = require('lodash.where');

// var iDict = { "124105": 2, "127849": 37 }; // starlight rose, flask of the countless armies
// var idDict = getItemsForIdDict(iDict);
// for(var key in idDict)
// {
//     var value = idDict[key];
//     console.log("This thing has "+value+" posts of " +key+"!");
// }
// function getItemsForIdDict(dict)
exports.getItemForIdDict = function(dict)
{ 
    itemsList = [];
    for(var id in dict)
    {
        console.log("USING ID: "+id);
        var apiKey = '27z4npkwrkpebk65nsb3rzxjzmqzfq4h';
        var region = 'en_US';
        //var id = 133568;

        var options = {
            host: 'us.api.battle.net',
            port: 443, // https | 80 for http
            path: '/wow/item/'+ id +'?locale='+ region +'&apikey='+ apiKey,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (fs.existsSync('itemNames.json'))
        {
            var data = fs.readFileSync('itemNames.json', 'utf8');
            var match = false;
            var object = JSON.parse(data);

            var filteredItems = where(object, {"id":id}); // get an array of json lines the given id
            if(filteredItems.length > 0)
            {
                match = true;
                console.log("Item found in cache, returning it! "+filteredItems[0].name);
                var item = {
                    "id": id,
                    "name": filteredItems[0].name
                }
                //console.log("Adding "+id+" "+obj.name+" to itemList");
                itemsList.push(item);
            }

            // not found, add it
            if (match === false) {
                var sync = true;
                r.getJSON(options,
                    function(statusCode, result)
                    {
                        var obj = JSON.parse(JSON.stringify(result));
                        
                        console.log("statusCode: " + statusCode);
                        if (statusCode === 200){
                            console.log(id + " corresonds THREE: "+obj.name);

                            var item = {
                                "id": id,
                                "name": obj.name
                            }
                            itemsList.push(item);
                            object.push(item);
                            json = JSON.stringify(object);
                            console.log("THIS IS ME, WRITING TO A FILE!");
                            fs.writeFileSync('itemNames.json', json, 'utf8');
                        }
                        sync = false;
                });
                while(sync){require('deasync').sleep(50);}
            }
                        
        }else{ // Only runs once.
            var sync = true;
            r.getJSON(options,
                function(statusCode, result)
                {
                    var obj = JSON.parse(JSON.stringify(result)); 
                    
                    console.log("statusCode: " + statusCode);
                    if (statusCode === 200){
                        console.log(id + " corresponds to "+obj.name);

                        var item = {
                            "id": id,
                            "name": obj.name
                        }
                        itemsList.push(item);
                        json = JSON.stringify(item);
                        fs.writeFileSync('itemNames.json', '['+json+']', 'utf8');
                    }
                    sync = false;
            });
            while(sync){require('deasync').sleep(50);}
        }

    } // end of massive for in loop
    return buildIdToNameDic(itemsList);

function buildIdToNameDic(itemsList){
    var dicto = {};
    for(i = 0; i < itemsList.length; i++)
    {
        // got to build a new dict which maps the ids to names
        var itemObj = itemsList[i];
        //console.log(itemObj.id + " Is our ID and "+itemObj.name+" is our NAME!");
        dicto[itemObj.id] = itemObj.name;
    }
    return dicto;
}

}
 
