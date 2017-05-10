import http from 'http';
import mongodb from 'mongodb';
import url from 'url';
import fs from 'fs';
import path from 'path';

let mongoClient = mongodb.MongoClient;

let mongourl = "mongodb://username:password@ds133231.mlab.com:33231/love-url-shortener";

const port = 2500;

mongoClient.connect(mongourl,function(err,db) {
    if(err) {
        console.log("Unable to connect to mongodb");
    } else {
        console.log("connection established to",mongourl);

        let server = http.createServer(function(req,res) {
            let reqUrl = url.parse(req.url).pathname.slice(1);
            if(reqUrl == 'favicon.ico' || reqUrl == "") {
                fs.readFile(path.join(__dirname,'../src/index.html'),function(err,data) {
                    if(err)
                        send404(res);
                    else
                        sendFile(res,data);
                });
            }else if(isNaN(reqUrl)) {
                saveUrl(reqUrl,db,res);
            } else {
                getShortUrl(reqUrl,db,res);
            }
        });

        server.listen(process.env.PORT || port);
    }
});

function saveUrl(url,db,res) {
    if(!validateUrl(url)){
        res.end("Url is not valid");
        return;
    }
    let collection = db.collection('urlstore');
    let random = Math.floor(Math.random()*10000);
    collection.insert({
        shortUrl: random,
        url:url
    },function(err,collection) {
        if(err) {
            console.log("Cannot insert into collection");
        } else {
            console.log("Insert successfull");
            res.end(JSON.stringify({"original_url":url,
                 "short_url":"https://love-url-shortener.herokuapp.com/"+random}));
        }
    });
}

function getShortUrl(url,db,res) {
    db.collection('urlstore').find({
        shortUrl:parseInt(url)
    }).toArray(function(err,collection) {
        if(err) {
            console.log("Cant find url:"+url);
        } else {
            let retUrl = collection[0].url;
            res.writeHead(301,
            {Location:retUrl}
            );
            res.end();
        }
    });
}

function validateUrl(url) {
    var re = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return re.test(url);
}

//sending home file
function sendFile(response,fileContents) {

    response.writeHead(200,
        {"content-type": "text/html"}
    );
    response.end(fileContents);
}

//handling error
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}
