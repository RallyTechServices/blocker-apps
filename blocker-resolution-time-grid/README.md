#Blocker Resolution Time

This app displays a grid with the blocked reasons and the mean, min and max
days to resolution as well as a total of blockers included in the calculations.  

##Criteria Parameters:

 * Start Date - selected by the "Show data from" drop down 
 * Project    - project selected in the top left corner  

##The data included in this chart will be the following:  

 * Any work items (Tasks, Defects or User Stories) that were changed 
   ON or AFTER the selected start date
 * Any work items (Tasks, Defects or User Stories) in the currently selected 
   project or any of its children that the current user has access to.
 * Only work items that have a BlockedReason are included in the distribution.
   Blockers with no BlockedReason will be ignored.  

## Notes
 * Any work items that are still blocked are not included in the total, average, min and max calculations.
 
 * Block times will be rounded to the nearest integer
 
 * If an item was blocked and unblocked within a day, then the total days to resolution for that 
   item will be zero.  
 
 * If an item was blocked and unblocked more than once in the requested time frame, then the 
   total days to resolution will be from the first time that the item was blocked until the 
   last time it was unblocked for that particular reason.  If an item was blocked and unblocked 
   multiple times over the requested date range, but with different reasons, then each time the item
   was blocked with each reason will be counted.  
 
 * If an item is blocked, but without a reason and a reason is added later, then the time starts from the time the reason was added.  
 * If an item is blocked, and the reason is removed, then the time ends when the reason is removed, not when the item is unblocked.  

 * If an item is blocked with Reason A and the Reason changes to Reason B this is what happens:  
 
 Blocked\Reason A >> Reason B >> Unblocked  (A = Blocked\Reason A -> Reason B, B = Reason B -> Unblocked)    
 Blocked\Reason A >> Reason B >> Reason A  >> Unblocked (A = Blocked\Reason A -> Unblocked, B = Reason B -> Reason A)  
 Blocked\Reason A >> Reason B >> Reason A  >> Reason B(2) >> Unblocked (A = Blocked\Reason A -> Reason B(2), B = Reason B -> Unblocked)  
 
 * Export will export a comma-delimited file of the current data (Reason, Mean, Min, Max, Total)  