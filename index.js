import express, { response } from 'express';
import fetch from "node-fetch";
import bodyParser from 'body-parser';
const app = express();
const port = 6789;
import { exportCommentToExcel } from './utils/exportData.js'
import { exportAllCommentToExcel } from './utils/exportData.js';
const access_token = "..." // access token
const url = 'https://graph.facebook.com/v12.0/'+ 'pageId_postId' +'?fields=comments{from,message,created_time}&filter=toplevel&limit=300&access_token=' + access_token;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(express.static("public"));

app.get('/', (req,res)=>{
    res.send("Hello, world!");
});

function isNumeric(num){
    return !isNaN(num)
};

function getCreatedTime(){
    const dateObj = new Date();
    const month = dateObj.getMonth() + 1
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    const output = day + '-' + month + '-' + year
    return output 
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

app.get('/get-all-comments', async (req,res) => {
    const options = {
        "method": "GET",
    };


    var response = await fetch(url, options)
        .then(res => res.json())
        .catch(e => {
            console.error({
                "message": "error",
                error: e,
            });
        });
        console.log(response.comments.paging.next)
    var comments = response.comments.data;    
        if(response.comments.paging.next){
            var nextResponse = await fetch(response.comments.paging.next, options)
                .then(res => res.json())
                .catch(e => {
                    console.error({
                        "message": "error",
                        error: e,
                    });
                });                
            comments = comments.concat(nextResponse.data)   
                while(nextResponse.paging.next){
                console.log(nextResponse.paging.next)   
                nextResponse = await fetch(nextResponse.paging.next)
                    .then(res => res.json())
                    .catch(e => {
                        console.error({
                            "message": "error",
                            error: e,
                        });
                    });             
                comments = comments.concat(nextResponse.data) 
            }
        }
        const workSheetColumnName = [
            "Tên facebook",
            "ID",
            "Thời gian comment",
            "Nội dung"
        ]
        const workSheetName = "Comments";
        const filePath = './outputFiles/' + getCreatedTime() + "-" + "all-comments" + ".xlsx";
        exportAllCommentToExcel(comments, workSheetColumnName, workSheetName, filePath);
        res.send("GET-ALL-COMMENTS => DONE!!!");
})

app.get('/get-noted-comments' , async (req,res) => {
    const options = {
        "method": "GET",
    };
    var response = await fetch(url, options)
        .then(res => res.json())
        .catch(e => {
            console.error({
                "message": "error",
                error: e,
            });
        });
        console.log(response.comments.paging.next)
    var comments = response.comments.data;    
        if(response.comments.paging.next){
            var nextResponse = await fetch(response.comments.paging.next, options)
                .then(res => res.json())
                .catch(e => {
                    console.error({
                        "message": "error",
                        error: e,
                    });
                });                
            comments = comments.concat(nextResponse.data)   
                while(nextResponse.paging.next){
                console.log(nextResponse.paging.next)   
                nextResponse = await fetch(nextResponse.paging.next)
                    .then(res => res.json())
                    .catch(e => {
                        console.error({
                            "message": "error",
                            error: e,
                        });
                    });             
                comments = comments.concat(nextResponse.data) 
            }
        }
        var filteredComments = comments.filter(function (entry){
            return entry.message.length <= 5;
        })

        var questionTime = [1, new Date("9/29/2021 20:17:14"), new Date("9/29/2021 20:18:42"), new Date("9/29/2021 20:20:33"), new Date("9/29/2021 20:23:14"), new Date("9/29/2021 20:25:47"), new Date("9/29/2021 20:28:55"), new Date("9/29/2021 20:30:50"), new Date("9/29/2021 20:33:01"), new Date("9/29/2021 20:37:07"), new Date("9/29/2021 20:41:45")]

        const Answer = [1, 'a', 'd', 'd', 'b', 'b', 'c', 'd', 'b', 'c', 'a']
        var countedComments = filteredComments.filter((entry) => {
            var answerTime = new Date(entry.created_time)
            for(var i = 1; i < Answer.length; i++){
                var digits;
                if(i >= 1 && i <= 9){
                    digits = 2;
                }else if(i >= 10 && i <= 99){
                    digits = 3;
                }
                if(parseInt(entry.message.slice(0,digits)) == i && isNumeric(entry.message.charAt(0))){
                    if(!(entry.message.indexOf(Answer[i].toLowerCase()) === -1) || !(entry.message.indexOf(Answer[i].toUpperCase()) === -1) ){
                        entry.doneTime = (answerTime.getTime() - questionTime[i].getTime())/1000;
                    }
                }
            }
            return entry.doneTime
        })


        countedComments = countedComments.sort(function(x,y){
            if(x.from.id == y.from.id){
                return x.created_time - y.created_time;
            }
            return y.from.id  - x.from.id;
        })
        var currentCandidate = countedComments[0];
        var counter = 1;
        var finalResult = [];
        var countedQuiz = [parseInt(currentCandidate.message)];
        var duplicate;
        for(var i = 1; i < countedComments.length; i++){
            if(currentCandidate && (currentCandidate.from.id == countedComments[i].from.id)){
                for(var j = 0; j < countedQuiz.length; j++){
                    if(parseInt(countedComments[i].message) == countedQuiz[j]){
                        duplicate = true;
                        break;
                    }
                    duplicate = false;
                }
                if(duplicate){
                    continue;
                }else{
                    currentCandidate.doneTime += countedComments[i].doneTime;
                    counter++;
                    countedQuiz.push(parseInt(countedComments[i].message));
                }

            }else{
                currentCandidate.doneTime /= counter;
                currentCandidate.message = counter;
                finalResult.push(currentCandidate);
                currentCandidate = countedComments[i];
                counter = 1;
                countedQuiz = [parseInt(currentCandidate.message)];
            }
        }

        finalResult = finalResult.sort((x,y) => {
            if(x.message == y.message){
                return x.doneTime - y.doneTime;
            }
            return y.message - x.message
        })

        const workSheetColumnName = [
            "Tên facebook",
            "ID",
            "Thời gian comment",
            "Thời gian làm",
            "Số câu đúng"
        ]
        const workSheetName = "Comments";
        const filePath = './outputFiles/' + getCreatedTime() + "-" + "filtered-comments" + ".xlsx";
        exportCommentToExcel(finalResult, workSheetColumnName, workSheetName, filePath);
        res.send("GET-NOTED-COMMENTS => DONE!!!")
})

app.listen(port, ()=>{
    console.log("server listening on port " + port);
});
