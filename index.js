var express = require('express');
var app = express();
var request = require('request');
var async = require('async');
const {Wit, log} = require('node-wit');
const client = new Wit({
  accessToken: 'LPDRFQJ75BGNLMM4MWBREUUBOJE2OXBE'
});

var coordinates = [];
function retrieveCoordinates(locations){
    async.each(locations, function(string, callback){
        var res = string.replace('/', '');
        res = res.split(' ').join('_');
        request('https://en.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates&titles=' + res, function(err, res){
            if (err){
                console.log('Error with Wikipedia API request');
                callback(err);
            }

            //grab coordinates from wiki query
            jsonQuery = JSON.parse(res.body).query.pages;
            for (key in jsonQuery){
                if (jsonQuery[key].coordinates){
                    coordinates.push([jsonQuery[key].coordinates[0].lat, jsonQuery[key].coordinates[0].lon]);
                }
            }
            callback();
        });
    }, function(err){
        if (err){
            console.log(err);
        }
        console.log(coordinates);
    });
}

//TODO: proper scoping
var targetLocations = [];
function retrieveLocations(locations){
    locationStrings = [];
    for (i = 0; i < locations.length; i += 15){
        end = i + 15;
        if (end > locations.length){
            end = locations.length;
        }
        locationStrings.push(locations.slice(i, end).toString());
    }

    async.each(locationStrings, function(string, callback){
        //append multiple links to same string to minimize API calls
        client.message(string, {})
        .then((data) => {
            for (j = 0; j < data.entities.location.length; j++){
                targetLocations.push(data.entities.location[j].value);
            }
            callback();
        })
        .catch(console.error);
    }, function(err){
        if (err){
            console.log(err);
        }

        retrieveCoordinates(targetLocations);
    });
}

function retrievePlot(title){
    //TODO: check if title is valid

    request('https://en.wikipedia.org/api/rest_v1/page/html/' + title, function(err, res){
        if (err){
            console.log('Error with Wikipedia API request');
            //TODO: proper error handling
            exit();
        }

        //parse out just the plot
        bIndex = res.body.indexOf('<h2 id="Plot">Plot</h2>');
        if (bIndex == -1){
            console.log('Error parsing Wikipedia page');
            //TODO: proper error handling
            exit();
        }

        //find the next h2 tag to get just the plot
        eIndex = - 1;
        i = bIndex + 24;
        while (i < res.body.length && eIndex == -1){
            fourChars = res.body.substring(i, i + 4);
            if (fourChars == '<h2 '){
                eIndex = i;
            }
            i += 1;
        }

        plot = res.body.substring(bIndex + 24, eIndex);

        re = /<a[^>]*>([\s\S]*?)<\/a>/g;
        var m;
        var locations = [];
        do {
            m = re.exec(plot);
            if (m) {
                locations.push(m[1]);
            }
        } while (m);

        retrieveLocations(locations);
    });
}

retrievePlot('London_Has_Fallen');

/*
app.get('/', function(req, res){
    request('https://en.wikipedia.org/api/rest_v1/page/html/Dog', function(req, res){
        console.log(res.type);
    });
});

app.listen(3000, function () {
  console.log('Listening on http://localhost:3000');
});
*/
