const mongo = require('mongoose');

var exerciseScheme = new mongo.Schema({
    description: {type: String,required:true},
    duration: {type:Number,required:true},
    date: String,
});

var userScheme = new mongo.Schema({
    username: {type:String,required:true},
    logs: [exerciseScheme]
});

var Exercise = mongo.model('Exercise',exerciseScheme);
var User = mongo.model('User',userScheme);

const fromDate = (from,cur) => from.getTime() <= cur.getTime();
const toDate = (to,cur) => to.getTime() > cur.getTime();

module.exports = {
    connect: (uri)=>{
        mongo.connect(uri);
    },
    create_user: (data,done)=>{
        var new_user = new User({username:data});
        new_user.save((err,data)=>{
            if(err) done(true);
            User.findById(data._id).select({logs:0,__v:0}).exec((err,userData)=>{
                if(err) done(true);
                done(false,userData);
            });
        });
    },
    create_exercise: (data,done)=>{
        var id = data.id;
        bodyData = data.data;
        User.findOne({_id:id},(err,data)=>{
            if(err) done(true);
            new_exercise = new Exercise({
                description: bodyData.description,
                duration: bodyData.duration,
                date: (bodyData.date == undefined || bodyData.date == null) ? new Date().toDateString() : new Date(bodyData.date).toDateString()
            });
            data.markModified('logs');
            data.save((err,resp)=>{
                if(err) done(true);
                var sending = {
                    _id: resp._id,
                    username: resp.username,
                    date: (bodyData.date == undefined || bodyData.date == null) ? new Date().toDateString() : new Date(bodyData.date).toDateString(),
                    duration: bodyData.duration,
                    description: bodyData.description
                };
                done(false,sending);
            });
        });
    },
    get_user: (data,done)=>{
        User.findById(data,(err,data)=>{
            if(err) done(true);
            done(false,data);
        });
    },
    get_all_users: (done)=>{
        User.find({}).select({logs:0,__v:0}).exec((err,data)=>{
            if(err) done(true);
            done(false,data);
        });
    },
    get_exercise: (data,done)=>{
        Exercise.find({_id:data}).select({username:1}).count({username:data.username}).all().exec((err,res)=>{
            if(err) done(true);
            done(false,data);
        });
    },
    get_logs: (searchID,from,to,limit,done)=>{
        User.findOne({_id:searchID})
        .select({__v:0})
        .exec((err,data)=>{
            if(err) done(true);

            let res = {};
            res['_id'] = data['_id'];
            res['username'] = data['username'];
            if(from != null) res['from'] = new Date(from).toDateString();
            if(to != null) res['to'] = new Date(to).toDateString();
            res['log'] = data['logs']
            .map((e,i)=>{
                var cur = {
                    description: e.description,
                    duration: e.duration,
                    date: e.date
                };
                if(from != null) 
                    if(!fromDate(new Date(from),new Date(e.date))) return;
                if(to != null)
                    if(!toDate(new Date(to),new Date(e.date))) return;
                if(limit != null && limit != '0')
                {
                    if(i<limit) return cur;
                    else return;
                } else return cur;
            }).filter(e=>e); 
            res['count'] = res['log'].length;
            done(false,res);
        });
    },
};