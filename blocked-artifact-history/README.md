#Blocked Artifact History

Shows all artifacts that have been blocked AFTER the selected start date.

The total duration is the sum of all blocked durations that started after the selected start date.
The average resolution time is the average time that it took all blocked durations to become unblocked.  This average includes any currently blocked items, which may not yet be unblocked. The duration will be from the day the item is blocked to the current date.

Durations are calculated in hours and converted to days for display.

Any items that are blocked for less than the threshold of 24 hours will not be displayed on the report.  Even if an item is currently blocked, it will not be displayed on the report unless it has been blocked for more than 24 hours.
Similarly, blocked durations of less than the threshold are not included in the total blocked time, average resolution time, or # durations.

The Iteration blocked in is the iteration that the item was first blocked in.  If there is no iteration associated with the time, then the iteration will be marked as "Unscheduled".

This app uses the LBAPI to collect historical data and javascript SDK 2.0.

![ScreenShot](/images/blocked-artifact-history.png)