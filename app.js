require('dotenv').config()
const jsxapi = require('jsxapi');
const ciscospark = require("ciscospark");

let wxt = ciscospark.init({
    credentials: {
            access_token: process.env.TEAMS_BOT_TOKEN
        }
});

// Vars used when capturing bad calls
let problemDescription = '';
let problemReporter = '';

// Connect to the device
console.log("connecting to your device...");
const xapi = jsxapi.connect(`ssh://${process.env.TP_HOST}`, {
    username: process.env.TP_USER,
    password: process.env.TP_PASSWORD
});

xapi.on('error', (err) => {
    console.error(`connexion failed: ${err}, exiting`);
    process.exit(1);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.status.on('SystemUnit State NumberOfActiveCalls', (callCounter) => {
    if(callCounter == 1){
          xapi.command("UserInterface Message Alert Display", {
              Text: 'OK, you are all set. Have a great meeting'
              , Title: 'Meeting Started Confirmation'
              , Duration:2
          }).catch((error) => { console.error(error); });
    }
});

xapi.event.on('CallDisconnect', (event) => {
    if(event.Duration > 0){
        xapi.command("UserInterface Message Prompt Display", {
              Title: "How was the meeting experience"
            , Text: 'Please rate this call'
            , FeedbackId: 'callrating'
            , 'Option.1':'That was Amazing!!!'
            , 'Option.2':'It was OK'
            , 'Option.3': 'It was terrible!'
          }).catch((error) => { console.error(error); });
    }
    else{
       xapi.command("UserInterface Message Prompt Display", {
              Title: "What went wrong?"
            , Text: 'Hm, no call. What happened?'
            , FeedbackId: 'nocallrating'
            , 'Option.1':'I dialled the wrong number!'
            , 'Option.2':"I don't know"
            , 'Option.3': 'oops, wrong button'
       }).catch((error) => { console.error(error); });
    }
});


xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case 'feedback_step1':
            problemDescription = event.Text
            sleep(1000).then(() => {
                xapi.command("UserInterface Message TextInput Display", {
                            Duration: 0
                        , FeedbackId: "feedback_step2"
                        , InputType: "SingleLine"
                        , KeyboardState: "Open"
                        , Placeholder: "Write your contact info here"
                        , SubmitText: "Next"
                        , Text: "Please let us know how we can contact you for a follow up"
                        , Title: "Contact info"
                    }).catch((error) => { console.error(error); });
            });
            break;
        case 'feedback_step2':
            problemReporter = event.Text
            sleep(500).then(() => {
                xapi.command("UserInterface Message Alert Display", {
                    Title: 'Feedback receipt'
                    , Text: 'Thank you for you feedback! Have a great day!'
                    , Duration: 3
                }).catch((error) => { console.error(error); });
                
                xapi.config.get('SystemUnit Name')
                            .then((unitName) => {
                                unitName = unitName == "" ? '' : unitName;
                                
                                wxt.messages.create({
                                    text: `Heads up folks!\n\n` +
                                            `It looks like there was just a bad call from the TP unit ${unitName}!\n\n` +
                                            `This issue was reported by ${problemReporter} and here's what they had to say:\n\n` +
                                            `- "${problemDescription}"`,          
                                    markdown: `## Heads up folks!\n\n` + 
                                                `It looks like there was just a bad call from the TP unit ${unitName}!\n\n` +
                                                `This issue was reported by **${problemReporter}** and here's what they had to say:\n\n` +
                                                `- "${problemDescription}"`,       
                                    roomId: process.env.TEAMS_SPACE_ID
                                  });

                            })
            });
            break;
    }
});



xapi.event.on('UserInterface Message Prompt Response', (event) => {
    var displaytitle = '';
    var displaytext = '';
    switch(event.FeedbackId){
        case 'callrating':
            switch(event.OptionId){
                case '1':
                    displaytitle = 'Thank you!';
                    displaytext = 'Yet another satisfied customer!!!';
                    xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
                    break;
                case '2':
                    displaytitle = ':-(';
                    displaytext = 'Ok, we will try even harder the next time';
                    xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
                    break;
                case '3':
                    xapi.command("UserInterface Message TextInput Display", {
                              Duration: 0
                            , FeedbackId: "feedback_step1"
                            , InputType: "SingleLine"
                            , KeyboardState: "Open"
                            , Placeholder: "Write your feedback here"
                            , SubmitText: "Next"
                            , Text: "Please let us know what you were not happy with. Your feedback is very important to us."
                            , Title: "We are so sorry,"
                      }).catch((error) => { console.error(error); });
                    break;
                default:
                    displaytext = 'Hm, that was an unhandled answer';
            }
            break;
        case 'nocallrating':
            switch(event.OptionId){
                case '1':
                    displaytitle = ':-)';
                    displaytext = 'Ok, maybe we need to make larger buttons..';
                    break;
                case '2':
                    displaytitle = 'Oops';
                    displaytext = 'Ok, do you want to try to debug?';
                    break;
                case '3':
                    displaytitle = ':-(';
                    displaytext = 'Oops, maybe we need a simpler user interface';
                    break;

                default:
                    displaytext = 'Hm, that was an unhandled answer';
            }
            xapi.command("UserInterface Message Alert Display", {
                Title: displaytitle
                , Text: displaytext
                , Duration: 5
            }).catch((error) => { console.error(error); });
    }
});