#Blocker Arrival Kill

This app shows the number of work items that were blocked within a particular 
month and the number of work items that were unblocked during that month.  

##Criteria Parameters:

 * Start Date - selected by the "Show data from" drop down 
 * Project    - project selected in the top left corner  

##The data included in this chart will be the following:  

 * Any work items (Tasks, Defects or User Stories) that were changed 
   ON or AFTER the selected start date
 * Any work items (Tasks, Defects or User Stories) in the currently selected 
   project or any of its children that the current user has access to.
 * Only work items that have a BlockedReason are counted towards the new blocker count.  
   Only work items that had a BlockedReason are counted towards the unblocked counts. 
   The assumption is that BlockedReason is cleared out when a story is unblocked.   

##Other features:
 * Export will export a comma-delimited file of the current data (Month, New Blockers, Resolved Blockers)  