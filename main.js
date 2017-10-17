
var express = require('express');
var fs = require('fs');
var path = require('path');
var stats = require('stats');
var pug = require('pug');
var yaml = require('js-yaml');
var csvtojson = require('csvtojson');
var app = express();

// Get the config
var config = require('config');
var serverConfig = config.get("server");
var project = config.get("project");
var notes = false;
// Use pug as the view engine
app.set('view engine','pug');
app.use(express.static('public'));
if (notes) {
  app.get("/", getNotes);
}else {
   app.get("/", getIndex);
}

var jsonData = new Object();
var projects = [];
jsonData.projects = projects;

if (notes) {
  dirToJson('public/'+project.dirname+'/','.md');
}else {
  csvToJson('public/projects/prepostprint.csv');
}
console.log(jsonData);

function getIndex(req, res) {
  var dataToSend = {
    title: "PrePostPrint",
    data: jsonData
  }
  console.log(dataToSend);
  res.render("index", dataToSend);
};
function getNotes(req, res) {
  var dataToSend = {
    title: "PrePostPrint",
    data: jsonData
  }
  console.log(dataToSend);
  res.render("notes", dataToSend);
};
function dirToJson(startPath,filter){
  if (!fs.existsSync(startPath)){
    console.log("no .md");
    return;
  }
  var files=fs.readdirSync(startPath);
  for(var i=0;i<files.length;i++){
    var filename=path.join(startPath,files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()){
      dirToJson(filename,filter);
    }
    else if (filename.indexOf(filter)>=0) {
      var slug = filename.split(path.sep)[2];
      var folder = path.dirname(filename);
      var rawContent = fs.readFile(filename, 'utf8', (err, data) => {
        if (err) throw err;
      });
      var content = yaml.safeLoad(rawContent);
      console.log(content);
      var images = [];
      var project = {
        'slug' : slug,
        'folder' : folder,
        'content': content,
        'title': content.title,
        'images' : imgSeek(folder)
      }
      // projects[slug] = project;
      jsonData.projects.push(project);
    };
  };
  return jsonData = jsonData;
};

function imgSeek(dir){
  var imglist = [];
  var files=fs.readdirSync(dir);
  for(var i=0;i<files.length;i++){
    var filename=path.join(dir,files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()){
      return
    }
    else if (filename.match(/.(jpg|jpeg|png|gif)$/i)) {
      filename = filename.split(path.sep)[3];
      imglist.push(filename);
    };
  };
  return imglist;
}

// csvtojson test
function csvToJson(csvFilePath){
  const csv=require('csvtojson')
  csv({
    noheader: true,
    // delimiter :"|",
    headers: ['id','name','email','bio', 'website','p1name', 'p1desc', 'p1img','p1imgsize','p2name', 'p2desc', 'p2img','p2imgsize','p3name', 'p3desc', 'p3img','p3imgsize',]
    })
  .fromFile(csvFilePath)
  .on('json',(jsonObj)=>{
    // jsonData.projects.push(JSON.stringify(jsonObj));
    jsonData.projects.push(jsonObj);
    // console.log(jsonData);
    return jsonData = jsonData;
    // fs.writeFile('data.json', JSON.stringify(jsonData), 'utf8', function cb(err, data){
    //   if (err){console.log(err);}
    // });
  })

  .on('done',(error)=>{
    console.log('jsontocsv end')
  })
}

var server = app.listen(serverConfig.port, serverConfig.host, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('DAAD listening at http://%s:%s', host, port);
});
