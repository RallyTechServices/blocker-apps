#Historical Blocker Reasons

This app shows a pie chart with the distribution of blocked reasons over for 
the selected date range.  

##Criteria Parameters:

 * Start Date - selected by the "Show data from" drop down 
 * Project    - project selected in the top left corner  

##The data included in this chart will be the following:  

 * Any work items (Tasks, Defects or User Stories) that were changed 
   ON or AFTER the selected start date.
 * If something was blocked BEFORE the requested start date but is still blocked, 
   it will not be included in the data.  
 * Any work items (Tasks, Defects or User Stories) in the currently selected 
   project or any of its children that the current user has access to.
 * Only work items that have a BlockedReason are included in the distribution.
   Blockers with no BlockedReason will be ignored.  

   ??Do we need an export?