import express from "express"
import bodyParser from "body-parser"
import { MongoClient } from "mongodb"
import bcrypt from "bcrypt"
import session from "express-session"
import path from "path"
import { fileURLToPath } from "url"

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* MIDDLEWARE */

app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
secret:"collegeportal",
resave:false,
saveUninitialized:true
}))

/* AUTH MIDDLEWARE */

function checkAuth(req,res,next){

if(req.session.user){
next()
}else{
res.redirect("/")
}

}

/* MONGODB */

const url = "mongodb://127.0.0.1:27017"
const client = new MongoClient(url)

let users

async function start(){

await client.connect()

const db = client.db("collegePortal")

users = db.collection("users")

console.log("MongoDB Connected")

app.listen(3000,()=>{
console.log("Server running http://localhost:3000")
})

}

start()

/* ROUTES */


/* LOGIN PAGE */

app.get("/",(req,res)=>{

if(req.session.user){
res.redirect("/home")
}else{
res.sendFile(path.join(__dirname,"public","login.html"))
}

})


/* HOME PAGE */

app.get("/home",checkAuth,(req,res)=>{

res.sendFile(path.join(__dirname,"public","home.html"))

})


/* FIRST YEAR */

app.get("/first-year",checkAuth,(req,res)=>{

res.sendFile(path.join(__dirname,"public","first-year.html"))

})


/* SECOND YEAR */

app.get("/second-year",checkAuth,(req,res)=>{

res.sendFile(path.join(__dirname,"public","second-year.html"))

})


/* THIRD YEAR */

app.get("/third-year",checkAuth,(req,res)=>{

res.sendFile(path.join(__dirname,"public","third-year.html"))

})


/* REGISTER */

app.post("/register", async (req,res)=>{

const {email,password} = req.body

const existingUser = await users.findOne({email})

if(existingUser){
return res.send("User already exists")
}

const hash = await bcrypt.hash(password,10)

await users.insertOne({
email,
password:hash
})

/* redirect to login page */

res.redirect("/")

})


/* LOGIN */

app.post("/login", async (req,res)=>{

const {email,password} = req.body

const user = await users.findOne({email})

if(!user){
return res.send("Invalid Email or Password")
}

const match = await bcrypt.compare(password,user.password)

if(match){

req.session.user=email

return res.redirect("/home")

}else{

return res.send("Invalid Email or Password")

}

})


/* LOGOUT */

app.get("/logout",(req,res)=>{

req.session.destroy(()=>{
res.redirect("/")
})

})