##Percentage of User Stories and Defects that are Blockers for a given month

An app that shows the percent of distinct work items (User Stories or Defects) 
blocked during the month versus work items never blocked during the month.  
[Get the code...](https://raw.githubusercontent.com/RallyTechServices/blocker-apps/master/pct-blocker-workitem/deploy/App.txt)

![ScreenShot](/images/pct-blocker-workitem.png)

###Notes
* Multiple blocks on one item are counted as one block. 

* If a work item was blocked before the month, it will not count towards the number
of work items blocked during the month.  It will be included in the not blocked during
the month count.  

Only Work items in the following states will be included in the total set:
 * Work items that were moved into In-Progress during the month.  
 * Work items that were in In-Progress during the month
 
 Edge case considerations:
 * Work items that were In-Progress, but never modified (thus no snapshot was created) during the month
