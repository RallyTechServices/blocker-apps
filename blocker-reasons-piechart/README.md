#Historical Blocker Reasons Pie Chart

This app shows a pie chart with the distribution of blocked reasons over for 
the selected date range.  
[Get the code...](https://raw.githubusercontent.com/RallyTechServices/blocker-apps/master/blocker-reasons-piechart/deploy/App.txt)

![ScreenShot](/images/blocker-reasons-piechart.png)

##Criteria Parameters:

 * Start Date - selected by the "Show data from" drop down 
 * Project    - project selected in the top left corner  

##About the data displayed in this chart:  

 * Any work items (Tasks, Defects or User Stories) that had a blocked reason and were changed 
   to a blocked or unblocked state ON or AFTER the first of the month as calculated by the 
   option selected in the "Show data from" drop down.
 * Work items in the currently selected project or any of its children that the current user has access to.
 * If an artifact was blocked BEFORE the requested start date and is still blocked, 
   it's reason will not be captured in the data.  
 * If an artifact was blocked and the reason changed before the artifact was unblocked, then the final reason is the 
   only one that will be captured.  
 * If an artifact was blocked and unblocked multiple times during the selected time frame, a blocked reason for each 
   blocked duration will be counted.  
 * Reason counts are case insensitive. 
   
##Notes: 
 * Data button will display a grid of data used in the chart creation.  
 * Export will export a comma-delimited file of the current data (FormattedID, Artifact Name, Blocked Reason)  
