# mark-over-time-jira-issues
A greasemonkey/tampermonkey script that marks Jira issues yellow, orange or red if they are about to or have gone over the estimated time

## How to install
1. In order to run this on Jira you need to install a plugin/extension for your browser
   - Chrome/Safari/Opera: [Tampermonkey](https://tampermonkey.net/). Click the button under the section "Download/Installation". If there are multiple options choose the one labeled "Stable
   - Firefox: [Greasemonkey](https://addons.mozilla.org/sv-se/firefox/addon/greasemonkey/)
2. The plugin/extension should now be installed (you might need to restart the browser) and enabled in your browser.
3. See the list of files in the section above this text? Click on the file **jiraMarkOverTimeIssues.user.js**
4. Click the *"raw"* button in the toolbar above the code/text
5. You should now be redirected to the extensions' page where it will help you install the script by clicking the *"install"* button
6. If you go to your Jira board you should now see a blue button labeled "Hide warning colors" next to the gray buttons in the top right toolbar. The issues on the board that are above 50, 75 or 100 percent of the estimated time should also be colored yellow, orange and red.
