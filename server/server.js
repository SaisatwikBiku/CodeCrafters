import express from 'express';

const app = express()

app.get("/",(req, res)=>{
    res.send({"message":"hello world"})
})

app.listen(5000, ()=>{
    console.log("started listening on 5000")
})