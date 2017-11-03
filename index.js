var express = require('express');
var app = express();
var request = require('request');
var async = require('async');
const {Wit, log} = require('node-wit');
const client = new Wit({
  accessToken: 'LPDRFQJ75BGNLMM4MWBREUUBOJE2OXBE'
});

var coordinates = [];
function retrieveCoordinates(locations, fcn){
    async.each(locations, function(string, callback){
        var res = string.replace('/', '');
        res = res.split(' ').join('_');
        request('https://en.wikipedia.org/w/api.php?action=query&format=json&prop=coordinates&titles=' + res, function(err, res){
            if (err){
                fcn('Error with Wikipedia API request');
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

        if (coordinates.length < 1){
            fcn('coordinates: {}');
        }
        else {
            var jsonResponse = 'coordinates : {';
            i = 0;
            while (i < coordinates.length - 1){
                jsonResponse += '[' + coordinates[i][0] + ',' + coordinates[i][1] + '],';
                i += 1;
            }
            jsonResponse += '[' + coordinates[i][0] + ',' + coordinates[i][1] + ']';
            jsonResponse += '}';

            fcn(jsonResponse);
        }
    });
}

var targetLocations = [];
function retrieveLocations(locations, fcn){
    var locationStrings = [];
    for (i = 0; i < locations.length; i += 15){
        var end = i + 15;
        if (end > locations.length){
            end = locations.length;
        }
        locationStrings.push(locations.slice(i, end).toString());
    }

    async.each(locationStrings, function(string, callback){
        //append multiple links to same string to minimize API calls
        client.message(string, {})
        .then((data) => {
            if (data.entities.location){
                for (j = 0; j < data.entities.location.length; j++){
                    targetLocations.push(data.entities.location[j].value);
                }
            }
            callback();
        })
        .catch(console.error);
    }, function(err){
        if (err){
            console.log(err);
            fcn('Error with Wit.ai');
            return;
        }

        if (targetLocations.length >= 1){
            retrieveCoordinates(targetLocations, fcn);
        }
        else{
            fcn('coordinates: []');
        }
    });
}

function retrievePlot(title, fcn){
    request('https://en.wikipedia.org/api/rest_v1/page/html/' + title, function(err, res){
        if (err){
            fcn('Invalid Wikipedia article');
            return;
        }

        //parse out just the plot
        var bIndex = res.body.indexOf('<h2 id="Plot">Plot</h2>');
        if (bIndex == -1){
            fcn('Invalid Wikipedia article');
            return;
        }

        //find the next h2 tag to get just the plot
        var eIndex = - 1;
        var i = bIndex + 24;
        while (i < res.body.length && eIndex == -1){
            var fourChars = res.body.substring(i, i + 4);
            if (fourChars == '<h2 '){
                eIndex = i;
            }
            i += 1;
        }

        var plot = res.body.substring(bIndex + 24, eIndex);
        var re = /<a[^>]*>([\s\S]*?)<\/a>/g;
        var m;
        var locations = [];
        do {
            m = re.exec(plot);
            if (m) {
                locations.push(m[1]);
            }
        } while (m);

        retrieveLocations(locations, fcn);
    });
}

/*
    Server Routes
*/

app.get('/', function(req, res){
    retrievePlot('London_Has_Fallen', function(jsonResponse){
        res.send(jsonResponse);
    });
});

app.get('/:article', function(req, res){
    console.log(req.params.article)
    retrievePlot(req.params.article, function(jsonResponse){
        res.send(jsonResponse);
    });
});

app.listen(3000, function () {
  console.log('Listening on http://localhost:3000');
});
