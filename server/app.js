
const express = require('express');
const pgp = require('pg-promise')();
const bcrypt = require('bcrypt');
require("dotenv").config();
const PORT = 5000;
const { generateAccessToken } = require("./jwttoken");
const jwt = require("jsonwebtoken")
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const cn = {
    host: process.env.localhost,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password,
    port: process.env.port,
};

const db = pgp(cn);

app.post('/login', async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try{
        const data = await db.query(`SELECT * FROM logininfo WHERE email='${email}'`);

        if(data.length!=0){
            const hashedpass = data[0].password;
            
            if(await bcrypt.compare(password, hashedpass)){
                const token = generateAccessToken({email: email});
                res.send({accesstoken: token});
            }
            else{
                res.send('Email or Password is incorrect!');
            }
        }
        else{
            res.send('User is not registered!');
        }
    }
    catch(err){
        console.log(err);
    }
});

function validateToken(req, res, next){
    const authHeader = req.headers["authorization"]
    const token = authHeader.split(" ")[1]

    if(token==null){
        res.sendStatus(400).send("Token not present")
    }

    console.log(token);

    jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token invalid:', err);
            return res.status(403).json({ error: 'Invalid token' });
        }
        else {
            req.user = decoded;
            next();
            console.log('Decoded payload:', decoded);
        }
    });
        

};

app.post("/signup", validateToken, async (req, res) => {
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        if(data[0]?.role=="admin"){
    
            const email = req.body.email;
            const hashpass = await bcrypt.hash(req.body.password, 12);

            try{
                const data = await db.query(`SELECT * FROM logininfo WHERE email=$1`,[email]);

                if(data.length!=0){
                    console.log("Email is already Registered!");
                    throw new Error("Email is Registered!")
                }
                else{
                    await db.none('INSERT INTO logininfo (email, password) VALUES ($1, $2)',[email, hashpass]);
                    await db.none('INSERT INTO userinfo (email, role) VALUES ($1, $2)', [email, 'user'])
                }

                res.send("Signup is Successful!");
            }
            catch(err){
                console.log("Error in Signup: ", err);
                res.send(toString(err));
            }
        }
    }
    catch(err){
        console.log(err);
    }
});

app.get("/users", validateToken, async (req, res) => {
    console.log("rin")
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);
        console.log("run");

        if(data[0]?.role=="admin"){
            console.log("hi");
            try{
                const data = await db.query(`SELECT * FROM userinfo`);

                res.send(data);
            }
            catch(err){
                console.log("Error in Returning Users: ", err);
                res.send(toString(err));
            }
        }
    }
    catch(err){
        console.log(err);
        res.send("error");
    }
});

app.get("/checkrole", validateToken, async(req, res) =>{
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        res.send(data[0]);
    }
    catch(err){
        console.log(err);
    }
});

app.get("/subscriptions", validateToken, async(req, res) =>{
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        if(data[0]?.role=="admin"){
            try{
                const data = await db.query('SELECT * FROM subscriptions');
                console.log(data);
                res.send(data);
            }
            catch(err){
                console.log(err);
            }
        }
        else{
            try{
                const data = await db.query('SELECT * FROM subscriptions WHERE email=$1',[req.user.email]);
                console.log(data);
                res.send(data);
            }
            catch(err){
                console.log(err);
            }
        }
    }
    catch(err){
        console.log(err);
    }
});

app.post('/subscriptions', validateToken, async(req, res) =>{
    console.log(req.body.formdata);
    const { service_name, cost, billing_cycle, renewal_date, notes, visibility, } = req.body.formdata;
    console.log(renewal_date + 'visibiltiy: ' + typeof(renewal_date));
    try{
        await db.none(
            `INSERT INTO subscriptions 
            (service_name, cost, billing_cycle, renewal_date, notes, email, visibility)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [service_name, cost, billing_cycle, renewal_date, 'HI', req.user.email, visibility]
        );
        res.send('Successfully Created!');
    }
    catch(err){
        console.log(err);
        res.send('error', err);
    }
});

app.put("/subscriptions", validateToken, async(req, res) => {
    const { service_name, cost, billing_cycle, renewal_date, notes, visibility, id} = req.body.formdata;
    console.log(service_name);
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        if(data[0]?.role=="admin"){
            try{
                await db.none('UPDATE subscriptions SET service_name=$1, cost=$2, billing_cycle=$3, renewal_date=$4, notes=$5, visibility=$6 WHERE id=$7',[service_name, cost, billing_cycle, renewal_date, notes, visibility, id]);
            }
            catch(err){
                console.log(err);
            }
        }
        else{
            try{
                await db.none('UPDATE subscriptions SET service_name=$1, cost=$2, billing_cycle=$3, renewal_date=$4, notes=$5, visibility=$6 WHERE id=$7 AND email=$8',[service_name, cost, billing_cycle, renewal_date, notes, visibility, id, req.user.email]);
            }
            catch(err){
                console.log(err);
            }
        }
    }
    catch(err){
        console.log(err);
    }
});

app.put("/subscriptions/visibility", validateToken, async(req, res) => {
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        if(data[0]?.role=="admin"){
            const { visibility, id } = req.body;
            try{
                await db.none('UPDATE subscriptions SET visibility=$1 WHERE id=$2',[visibility, id]);
                res.send("success");
            }
            catch(err){
                console.log(err);
            }
        }
    }
    catch(err){
        console.log(err);
    }
})

app.delete("/subscriptions", validateToken, async(req, res) => {
    const id  = req.body.id;
    console.log(id);
    try{
        const data = await db.query('SELECT role FROM userinfo WHERE email=$1',[req.user.email]);

        if(data[0]?.role=="admin"){
            try{
                await db.none('DELETE FROM subscriptions WHERE id=$1',[id]);
            }
            catch(err){
                console.log(err);
            }
        }
        else{
            try{
                await db.none('DELETE FROM subscriptions WHERE id=$1 AND email=$2',[id, req.user.email]);
            }
            catch(err){
                console.log(err);
            }
        }
    }
    catch(err){
        console.log(err);
    }
});

app.get("/subscriptions/shared", validateToken, async(req, res) => {
    try{
        const data = await db.query(`SELECT * FROM subscriptions WHERE visibility='shared'`);

        res.send(data);
    }
    catch(err){
        console.log(err);
    }
});

app.post("/ai", validateToken, async(req, res) =>{
    try{
        const data = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json',
                'X-goog-api-key': process.env.GEMINI_KEY 
            },
            body: JSON.stringify({
                "contents": [
                {
                    "parts": [
                    {
                        "text": `Take this information, it contains various subscription services listed out, it has the structure of id, service_name, cost, billing_cycle and many 
                        subscriptions like this. Analyse these services and categorise them into optional or necessary. Give the output in a very specific format, your output should only contain these three things, system note: do not include anything extra in the output, if you feel confused use your best assumptions but never say anything more in output.
                         like optional: (id of optional services here). 
                        necessary: (id of necessary services here). Optional improvements: (Optional improvements that can be made to save money or reduce carbon footprint). Here is the service list: ${req.body.val}`
                    }
                    ]
                }
                ]
            })
        });

        const resData = await data.json();

        res.send(resData);
    }
    catch(err){
        console.log(err);
    }
})

app.listen(PORT, () => {
    console.log('Server running on port: 5000');
});