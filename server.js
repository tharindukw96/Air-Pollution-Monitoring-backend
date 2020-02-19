var admin = require("firebase-admin");
var express = require('express');
const app = express();
bodyParser = require('body-parser');
var jsonexport = require('jsonexport');
var fs = require('fs');
app.use(bodyParser());

var serviceAccount = require("./airquality-92528-firebase-adminsdk-wefww-f4a50fb1d0.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://airquality-92528.firebaseio.com"
});

var db = admin.firestore();


//Convert JSON to csv
function convertToCSV(data) {

    var json = JSON.stringify(data);
    fs.writeFile('myjsonfile.json', json, 'utf8', function(){
        var reader = fs.createReadStream('myjsonfile.json');
        var writer = fs.createWriteStream('out.csv');
        reader.pipe(jsonexport()).pipe(writer);
    });
}


//Handle http requests

app.get('/data', (req, res) => {
    var ref = db.collection("/air_quality_data").get().then((snapshot) => {
        var dataList = [];
        snapshot.forEach((doc) => {
            //console.log(doc.id, '=>', doc.data());
            dataList.push(doc.data());
        });
        convertToCSV(dataList);
        res.download('./out.csv');
    })
        .catch((err) => {
            console.log('Error getting documents', err);
        });

});

app.put('/data', (req, res) => {
    var ref = db.collection("/air_quality_data")
    if(req.body.data){
        var data = req.params.data;
        data.forEach(item=>{
            ref.add(item);
        });
    }
    res.send({"msg" : "Data added!"});
});

var server = app.listen(process.env.PORT || 3000, function () { });