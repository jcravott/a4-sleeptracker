--Readme document for *James Cravotta*, *jcravott@uci.edu*--
GROUP NUMBER 101 (solo)
1. How many assignment points do you believe you completed (replace the *'s with your numbers)?

10/10
- 1/1 The ability to log overnight sleep
- 1/1 The ability to log sleepiness during the day
- 1/1 The ability to view these two categories of logged data
- 2/2 Either using a native device resource or backing up logged data
- 2/2 Following good principles of mobile design
- 2/2 Creating a compelling app
- 1/1 A readme and demo video which explains how these features were implemented and their design rationale

2. How long, in hours, did it take you to complete this assignment?

~10 hours

3. What online resources did you consult when completing this assignment? (list specific URLs)

I consulted the Ionic documentation: https://ionicframework.com/docs/
the Assignment starter: https://github.com/travislindenreid/a4-sleeptracker
the Stanford Sleepiness Scale: https://web.stanford.edu/~dement/sss.html
and I used ChatGPT for implementation assistance, debugging, and design feedback (https://chatgpt.com)

4. What classmates or other individuals did you consult as part of this assignment? What did you discuss?

None; I completed the assignment individually.

5. Is there anything special we need to know in order to run your code?

Run 'npm install' followed by 'ionic serve' inside the 'sleeptracker' directory. The application runs in a browser without requiring an emulator or physical device.

--Aim for no more than two sentences for each of the following questions.--


6. Did you design your app with a particular type of user in mind? If so, whom?

The app doesn't have a particular target audience, but is generally designed for people familiar with smartphones who don't mind manually entering data.

7. Did you design your app specifically for iOS or Android, or both?

The app is designed for both platforms using Ionic's responsive components, though it was primarily tested with the iPhone 16's aspect ratio and viewport dimensions.

8. How can a person log overnight sleep in your app? Why did you choose to support logging overnight sleep in this way?

Users can manually set their bedtime and wake-up time, with sleep duration automatically calculated. Manual entry was chosen over automatic entry to prevent users from having to leave the app running overnight.

9. How can a person log sleepiness during the day in your app? Why did you choose to support logging sleepiness in this way?

Users can select daytime sleepiness from a range of 1–7 and record the time. Descriptions based off the Stanford Sleepiness scale are provided for each rating to make selecting a sleepiness level easier.

10. How can a person view the data they logged in your app? Why did you choose to support viewing logged data in this way?

The History tab displays all previous entries, with filters for sleep and sleepiness. Users can also edit and delete entries, allowing them to correct mistakes.

11. Which feature choose--using a native device resource, backing up logged data, or both?

I implemented persistent local data storage rather than using a native device resource.

Additionally, as an extra bonus feature I added a simple "Do not ask again" checkbox for the deletion prompt, to make repetitive deletions easier.

12. If you used a native device resource, what feature did you add? How does this feature change the app's experience for a user?

N/A

13. If you backed up logged data, where does it back up to?

Records are saved using the browser's localStorage system, letting entries persist after refreshing or reopening the application without requiring an external database.

14. How does your app implement or follow principles of good mobile design?

The initial screen shows sleep statistics and allows easy logging. Input validation is included to help prevents mistakes, editing and Undo help correct errors, and Ionic's interface follows mobile design conventions.