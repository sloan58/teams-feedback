# Webex Teams Feedback from xAPI

This script allows you to collect feedback from the xAPI using TP endpoints and submit it to a Webex Teams Room.  There are a couple things that you need in order to run the integration:

  - A Webex Teams Bot Access Token - get that at the [Webex Developer Site](https://developer.webex.com)
  - A Webex Space ID - also get that at the [Webex Developer Site](https://developer.webex.com)
  - The IP/FQDN of the TP endpoint
  - The login credentials with API access
 
Place these settings in the .env file (cp .env.example .env)

# Run the script!

  - Clone this report
  - npm install
  - cp .env.example .env
  - Fill in your app-specific details
  - node app.js

After a call completes (with a duration > 0) a survey will prompt for feedback.  Select option 3 (It was terrible!) and then you can enter in your feedback and contact.  This information will be posted to the Webex Teams space that you define in the .env file.

# Note!

If your system doesn't have a name set, you might want to set one first so your feedback is better....

```
xapi.config.set('SystemUnit Name', 'SomeUniqueName');
```

# teams-feedback
