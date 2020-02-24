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
async function convertToCSV(data) {

    var json = JSON.stringify(data);
    fs.writeFile('myjsonfile.json', json, 'utf8', function(){
        var reader = fs.createReadStream('myjsonfile.json');
        var writer = fs.createWriteStream('out.csv');
        reader.pipe(jsonexport()).pipe(writer);
    });
}


//Handle http requests

app.get('/data', async (req, res) => {
    var ref = db.collection("/air_quality_data_1").get().then((snapshot) => {
        var dataList = [];
        snapshot.forEach((doc) => {
            //console.log(doc.id, '=>', doc.data());
            var filterData = [];
            [doc.data()].forEach(item=>{
                var d = new Date(item.date._seconds*1000);

                //console.log(item['pm2_5'])
                var t = new Date(item.time);
                dataList.push({
                    Date : d.getDate()+"/"+d.getMonth()+"/"+d.getFullYear(),
                    Time : t.getHours()+":"+t.getMinutes()+":"+t.getSeconds(),
                    CO : item['co'],
                    NO : item['no'],
                    PM10 : item['pm10'],
                    PM25 : item['pm2_5']
                })
            });

            //dataList.push(filterData);
        });
        await convertToCSV(dataList);
        res.download('./out.csv');
    })
        .catch((err) => {
            console.log('Error getting documents', err);
        });

});

/*app.put('/data', (req, res) => {
    var ref = db.collection("/air_quality_data")
    if(req.body.data){
        var data = req.params.data;
        data.forEach(item=>{
            ref.add(item);
        });
    }
    res.send({"msg" : "Data added!"});
});
*/
var server = app.listen(process.env.PORT || 3000, function () { });