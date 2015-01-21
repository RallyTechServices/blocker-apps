#Blocker Arrival Kill

This app shows the number of work items that were blocked within a particular 
month and the number of work items that were unblocked during that month.  
[Get the code...](https://raw.githubusercontent.com/RallyTechServices/blocker-apps/master/blocker-arrival-kill/deploy/App.txt)

![ScreenShot](/images/blocker-arrival-kill.png) 

##Criteria Parameters:

 * Start Date - selected by the "Show data from" drop down 
 * Project    - project selected in the top left corner  

##The data included in this chart will be the following:  

 * Any work items (Tasks, Defects or User Stories) that were changed 
   ON or AFTER the first of the month indicated by the selected start date through the current date.  
   Note that the * for the last month indicates that the month may not be complete.  
 * Any work items (Tasks, Defects or User Stories) in the currently selected 
   project or any of its children that the current user has access to.   
 * Only work items that have a BlockedReason are counted towards the new blocker count.  
   Only work items that had a BlockedReason are counted towards the unblocked counts. 
   The assumption is that BlockedReason is cleared out when a story is unblocked.   

##Notes:
 * If an artifact was blocked without reason and later unblocked, neither the block nor the unblock will be included in the data.
 * If an artifact was blocked without reason and a reason was added at a later date during the same blocked duration, then the time
   recorded for the block will be when the artifact was blocked.  
 * If an artifact is blocked and unblocked more than once within the same month, each block\unblock will be counted if there was a blocked reason.  
 * If the BlockedReason is changed during any block duration, then the last blocked reason will be used for the exported data
 * If the BlockedReason is removed before the artifact is unblocked, the unblocked transition will not be included in the data.
 * Data button will display a grid of data used in the chart creation.  
 * Export will export a comma-delimited file of the current data (FormattedID, Name, Date Blocked, Date Unblocked)  