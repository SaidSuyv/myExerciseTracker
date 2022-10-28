const express = require('express')
const app = express()
const cors = require('cors')
const mongo = require('./mongo');
require('dotenv').config()

mongo.connect(process.env.MONGO_URI);

app.use(cors())
app.use(express.static('public'))
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users',(req,res)=>{
  var {body} = req;
  if(body.username != undefined){
    mongo.create_user(body.username,(err,data=null)=>{
      if(err) res.json({err:true,message:'The username could not be created.'});
      if(data) res.json(data);
      else res.json({err:true,message:'Returned data is not normal',data:data});
    });
  }
  else res.json({err:true,message:'You must provide a username.'});
});

app.get('/api/users',(req,res)=>{
  mongo.get_all_users((err,data=null)=>{
    if(err) res.json({error:true,message:'There was an error getting al users'});
    res.json(data);
  });
});

app.post('/api/users/:_id/exercises',(req,res)=>{
  var {body} = req;
  var {_id} = req.params;
  mongo.create_exercise({id:_id,data:body},(err,data=null)=>{
    if(err) res.json({err:true,message:'Something went wrong.'});
    res.json(data);
    return;
  });
});

app.get('/api/users/:_id/logs',(req,res)=>{
  var {_id} = req.params;
  var query = req.query;
  let limit = (query.limit != null || query.limit != undefined) ? query.limit : null;
  let from = (query.from != null || query.from != undefined) ? query.from : null;
  let to = (query.to != null || query.to != undefined) ? query.to : null;
  mongo.get_logs(_id,from,to,limit,(err,data)=>{
    if(err) res.json({err:true,message:'Something went wrong'});
    res.json(data);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
