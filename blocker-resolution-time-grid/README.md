#Blocker Resolution Time

This app displays a grid with the blocked reasons and the mean, min and max
days to resolution as well as a total of blockers included in the calculations.  
[Get the code...](https://raw.githubusercontent.com/RallyTechServices/blocker-apps/master/blocker-resolution-time-grid/deploy/App.txt)

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
 
 * Block durations will be rounded up to the nearest day.  If a block duration is less than one minute, it will show as 0.  
 
 * When calculating counts and statistics, reasons are case insensitive.  Statistics are rounded to the nearest integer.  
 
 * If an item was blocked and unblocked within a day, then the total days to resolution for that 
   item will be zero.  
 
 * If an item was blocked and unblocked 
   multiple times over the requested date range, but with different reasons, then each time the item
   was blocked with each reason will be counted.  
 
 * If an item is blocked, but without a reason and a reason is added later, then the time starts from the time the reason was added. 
  
 * If an item is blocked, and the reason is removed, then the time ends when the reason is removed, not when the item is unblocked.  

 * If an item is blocked and the reason is changed during the duration of that blockage, then the resolution time is calculated
   for the final reason of the duration for the entire duration.
   
 * Export will export a comma-delimited file of the data that was used in the grid (FormattedID, Name, BlockedReason, BlockedDate, UnblockedDate)  