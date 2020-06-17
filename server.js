const express = require("express")
const bodyParser = require('body-parser')
const path = require("path")
const crypto = require('crypto')
const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')

const app = express();

//middle ware
app.use(bodyParser.json())
app.use(methodOverride("_method"))//suppose to let us use a query string in order to make a delete request
app.set('view engine', 'ejs');
//this uses set to find the ejs index file in views

//Mongo URI
const mongoURI = 'mongodb://localhost/image_db'

//mongo connection
const conn = mongoose.createConnection(mongoURI)

//init GFS- initialize stream
let gfs;

conn.once('open',()=>{
    //init stream
    gfs =Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads')
})

//create storage 
const storage = new GridFsStorage({
    url: mongoURI,
    file:(req,file)=>{
        return new Promise((resolve, reject)=>{
            //this will generate a 16 character name
            crypto.randomBytes(16,(err,buf)=>{
                if(err){
                    return reject(err)
                }
                //this will create the filename with the extention
                const filename = buf.toString('hex') + path.extname(file.originalname)
                //were going to create an object called file info
                const fileInfo ={
                    //we will create an object with the filname and a bucketname
                    filename: filename,
                    //buckename should be the cellection name
                    bucketName: "uploads"
                }
                //resolve the promise with the returning info object
                resolve(fileInfo)
            })
        })
    }
})
//this will create an upload variable and use multer to run the storage function
// console.log("here is multer",storage)
const upload = multer({ storage })

//
app.get('/', (req, res)=>{
res.render('index')
});

//post = upload
                  //upload is the storage variable and 
                 //the word single is the amount of files you want ot uplaod at once
                 //input name ="file" that name is what you are referencing here
app.post('/upload', upload.single('file'), (req, res)=> {
// res.json({file:req.file}); // this will respond with the json info
res.redirect('/')
})
//more routes
//get req
//display all files
app.get('/files', (req, res)=>{
gfs.files.find().toArray((err,files)=>{
    if(!files || files.length === 0){
        return res.status(404).json({
            err: 'no files exist'
        })
    }
    return res.json(files);
 })
})
//get file by name
app.get('/files/:filename', (req, res)=>{
    gfs.files.findOne({filename: req.params.filename}, (err, file)=>{
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'no file exist'
            })
        }
        //file exists
        return res.json(file)
    })
    })


//in order to acually interprest the json data as an image we have to use read stream


const port = 5000

app.listen(port, () => console.log(`server started on ${port}`))


// Multer is a NodeJS middleware which facilitates file uploads. 
//And GridFsStorage is GridFS storage engine for 
//Multer to store uploaded files directly to MongoDB.


//heres the response on upload
// "file": {
//     "fieldname": "file",
//     "originalname": "Screen Shot 2020-05-22 at 10.28.56 PM.png",
//     "encoding": "7bit",
//     "mimetype": "image/png",
//     "id": "5ee986dd4032b72276bf6e6f",
//     "filename": "cc4d03e9badb2f586a91c5b10dda1a0e.png", (this was generated through the crypto thing.)
//     "metadata": null,
//     "bucketName": "uploads",
//     "chunkSize": 261120,
//     "size": 164578,
//     "md5": "05340f62e1f43d34abc15383035623f5",
//     "uploadDate": "2020-06-17T02:58:37.203Z",
//     "contentType": "image/png"
//     }