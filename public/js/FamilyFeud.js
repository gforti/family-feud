console.clear()

let app = {
    version: 1,
    role: "player",
    socket: io.connect(),
    jsonFile: "../public/data/FamilyFeud_Questions.json",
    currentQ: 0,
    wrong:0,
    board: $(`<div class='gameBoard'>

                <!--- Scores --->
                <div class='score' id='boardScore'>0</div>
                <div class='score' id='team1' >0</div>
                <div class='score' id='team2' >0</div>

                <!--- Main Board --->
                <div id='middleBoard'>

                    <!--- Question --->
                    <div class='questionHolder'>
                        <span class='question'></span>
                    </div>

                    <!--- Answers --->
                    <div class='colHolder'>
                    </div>

                </div>
                <!--- Wrong --->
                <div class='wrongX wrongBoard'>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                </div>

                <!--- Buttons --->
                <div class='btnHolder hide' id="host">
                    <div id='hostBTN'     class='button'>Be the host</div>
                    <div id='awardTeam1'  class='button' data-team='1'>Award Team 1</div>
                    <div id='newQuestion' class='button'>New Question</div>
                    <div id="wrong1"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id="wrong2"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id="wrong3"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id='awardTeam2'  class='button' data-team='2' >Award Team 2</div>
                </div>

                </div>`),
    
    // Utility functions
    shuffle: (array) => {
        let currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    jsonLoaded: (data) => {
        app.allData = data;
        app.questions = Object.keys(data);
        app.makeQuestion(app.currentQ);
        app.board.find('.host').hide();
        $('body').append(app.board);
    },

    // Action functions
    makeQuestion: (eNum) => {
        let qText = app.questions[eNum];
        let qAnswr = app.allData[qText];

        let qNum = qAnswr.length;
        qNum = (qNum < 8) ? 8 : qNum;
        qNum = (qNum % 2 != 0) ? qNum + 1 : qNum;

        let boardScore = app.board.find("#boardScore");
        let question = app.board.find(".question");
        let holderMain = app.board.find(".colHolder");

        boardScore.html(0);
        question.html(qText.replace(/&x22;/gi, '"'));
        holderMain.empty();

        app.wrong = 0;
        let wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        $(wrong).hide()

        qNum = 10

        for (var i = 0; i < qNum; i++) {
            let aLI;
            if (qAnswr[i]) {
                aLI = $(`<div class='cardHolder'>
                            <div class='card' data-id='${i}'>
                                <div class='front'>
                                    <span class='DBG'>${(i + 1)}</span>
                                    <span class='answer'>${qAnswr[i][0]}</span>
                                </div>
                                <div class='back DBG'>
                                    <span>${qAnswr[i][0]}</span>
                                    <b class='LBG'>${qAnswr[i][1]}</b>
                                </div>
                            </div>
                        </div>`)
            } else {
                aLI = $(`<div class='cardHolder empty'><div></div></div>`)
            }

            let parentDiv = holderMain//(i < (qNum / 2)) ? col1 : col2;
            aLI.on('click', {
                trigger: 'flipCard',
                num: i
            }, app.talkSocket);
            $(aLI).appendTo(parentDiv)
        }

        let cardHolders = app.board.find('.cardHolder');
        let cards = app.board.find('.card');
        let backs = app.board.find('.back');
        let cardSides = app.board.find('.card>div');

        TweenLite.set(cardHolders, {
            perspective: 800
        });
        TweenLite.set(cards, {
            transformStyle: "preserve-3d"
        });
        TweenLite.set(backs, {
            rotationX: 180
        });
        TweenLite.set(cardSides, {
            backfaceVisibility: "hidden"
        });
        cards.data("flipped", false);
    },
    getBoardScore: () => {
        let cards = app.board.find('.card');
        let boardScore = app.board.find('#boardScore');
        let currentScore = {
            var: boardScore.html()
        };
        let score = 0;

        function tallyScore() {
            if ($(this).data("flipped")) {
                let value = $(this).find("b").html();
                score += parseInt(value)
            }
        }
        $.each(cards, tallyScore);
        TweenMax.to(currentScore, 1, {
            var: score,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    awardPoints: (num) => {
        let boardScore = app.board.find('#boardScore');
        let currentScore = {
            var: parseInt(boardScore.html())
        };
        let team = app.board.find("#team" + num);
        let teamScore = {
            var: parseInt(team.html())
        };
        let teamScoreUpdated = (teamScore.var + currentScore.var);
        TweenMax.to(teamScore, 1, {
            var: teamScoreUpdated,
            onUpdate: function () {
                team.html(Math.round(teamScore.var));
            },
            ease: Power3.easeOut
        });

        TweenMax.to(currentScore, 1, {
            var: 0,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    changeQuestion: () => {
        app.currentQ++;
        app.makeQuestion(app.currentQ);
    },
    makeHost: () => {
        app.role = "host";
        app.board.find(".hide").removeClass('hide');
        app.board.addClass('showHost');
        app.socket.emit("talking", {
            trigger: 'hostAssigned'
        });
    },
    flipCard: (n) => {
        console.log("card");
        console.log(n);
        let card = $('[data-id="' + n + '"]');
        let flipped = $(card).data("flipped");
        let cardRotate = (flipped) ? 0 : -180;
        TweenLite.to(card, 1, {
            rotationX: cardRotate,
            ease: Back.easeOut
        });
        flipped = !flipped;
        $(card).data("flipped", flipped);
        app.getBoardScore()
    },
    wrongAnswer:(x)=>{
        app.wrong = x
        console.log("wrong: "+ app.wrong )
        let wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        for (let i = 1; i <= x; i++) {
            console.log(`img:nth-child(${i})`)
          $(wrong).find(`img:nth-child(${i})`).show()
        }
        $(wrong).show()
        setTimeout(() => { 
            $(wrong).hide()
        }, 1000); 

    },

    // Socket Test
    talkSocket: (e) => {
        if (app.role == "host") app.socket.emit("talking", e.data);
    },
    listenSocket: (data) => {
        console.log(data);
        switch (data.trigger) {
            case "newQuestion":
                app.changeQuestion();
                break;
            case "awardTeam1":
                app.awardPoints(1);
                break;
            case "awardTeam2":
                app.awardPoints(2);
                break;
            case "flipCard":
                app.flipCard(data.num);
                break;
            case "hostAssigned":
                app.board.find('#hostBTN').remove();
                break;
            case "wrong1":
                app.wrongAnswer(1)
                break;
            case "wrong2":
                app.wrongAnswer(2)
                break;
            case "wrong3":
                app.wrongAnswer(3)
                break;
        }
    },
    
    // Inital function
    init: () => {

        $.getJSON(app.jsonFile, app.jsonLoaded);

        app.board.find('#hostBTN'    ).on('click', app.makeHost);
        app.board.find('#awardTeam1' ).on('click', { trigger: 'awardTeam1' }, app.talkSocket);
        app.board.find('#awardTeam2' ).on('click', { trigger: 'awardTeam2' }, app.talkSocket);
        app.board.find('#newQuestion').on('click', { trigger: 'newQuestion'}, app.talkSocket);
        app.board.find('#wrong1'      ).on('click', { trigger: 'wrong1'      }, app.talkSocket);
        app.board.find('#wrong2'      ).on('click', { trigger: 'wrong2'      }, app.talkSocket);
        app.board.find('#wrong3'      ).on('click', { trigger: 'wrong3'      }, app.talkSocket);

        app.socket.on('listening', app.listenSocket)
    }
};
app.init();