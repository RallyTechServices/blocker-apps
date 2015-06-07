    Ext.define('Rally.technicalservices.calculator.BlockedReason', {
        extend: 'Rally.data.lookback.calculator.BaseCalculator',
        logger: new Rally.technicalservices.Logger(),

        config: {
            startDate: null
        },

        /**
         * Calculate extra chart fields that are derived based on the data retrieved by the store. This is passed
         * to the Lumenize {@link Rally.data.lookback.Lumenize.TimeSeriesCalculator TimeSeriesCalculator} as part of the
         * configuration. For example, if you want to calculate the number of completed stories, you would simply return
         * if the story is in a completed schedule state or not:
         *   return [{
         *       "as": "CompletedStoryCount",
         *       "f": function(snapshot) {
         *           var ss = snapshot.ScheduleState;
         *           if (ss === "Accepted" || ss === "Released") {
         *               return 1;
         *           }
         *           else {
         *               return 0;
         *           }
         *       }
         *   }];
         *
         * You can use these derived fields as part of the calculator metrics calculation.
         *
         * Object properties:
         *
         *   - The `as` property is the name the field is saved as for future reference
         *   - The `f` property can be a built in Lumenize function string or a custom function that takes `snapshot` as
         *   an argument
         *
         * @return {Array} a list of derived fields objects
         */
        getDerivedFieldsOnInput: function () {
            return [];
        },

        /**
         * Calculate the metrics that are displayed on the chart from the data retrieved by the store. This is passed
         * to the Lumenize {@link Rally.data.lookback.Lumenize.TimeSeriesCalculator TimeSeriesCalculator} as part of the
         * configuration. Metrics calculations can use fields that are derived using the #getDerivedFieldsOnInput
         * function. For example, if I derived a CompletedStoryCount field, I can display that field as a bar chart by
         * specifying:
         *   return [{
         *      "field": "CompletedStoryCount",
         *      "as": "Completed Stories",
         *      "f": "sum",
         *      "display": "column"
         *   }];
         *
         * The field is displayed in the chart as "Completed Stories" with each bar being a sum of that days completed
         * stories.
         *
         * Object properties:
         *
         *   - The `field` property is the field name to use to calculate the metric. This can be a field from the data
         *   or a derived field.
         *   - The `as` property is the name displayed to the user in the chart
         *   - The `f` property can be a built in Lumenize function string or a custom function that takes `snapshot` as
         *   an argument
         *   - The `display` property is used by the chart to determine how to display the data on a chart. Can be any
         *   Highcharts specific type, e.g., "line" or "column"
         *
         * @return {Array} a list of metric objects
         */
        getMetrics: function () {
            return [];
        },

        /**
         * Calculate summary metrics based on the data retrieved from the store. This is passed to the Lumenize
         * {@link Rally.data.lookback.Lumenize.TimeSeriesCalculator TimeSeriesCalculator} as part of the configuration.
         * Each summary metric also has access to any previously defined metrics or derived fields. This function is
         * useful to generate data that you do not necessarily want to render on the chart, but would like to use to get
         * more derived fields after the main chart metrics are defined. For example, if you wanted the max numbers for
         * different fields, you would specify:
         *      return [
         *          { "field": "TaskUnitScope", "f": "max" },
         *          { "field": "TaskUnitBurnDown", "f": "max" },
         *      ];
         *
         * The fields would then be available to the objects in #getDerivedFieldsAfterSummary. Note that the fields in
         * this case will need to be referenced by `TaskUnitScope_max` due to the use of the built-in `max` function. If
         * you wish to specify your own function, you must use the `as` property in order to reference the field in the
         * future. For example,
         *      return [{
         *          "as": "TaskUnitBurnDown_max_index",
         *          "f": function(seriesData, metrics) {
         *              var i, length = seriesData.length;
         *              for(i = 0; i < length; i++) {
         *                  var data = seriesData[i];
         *                  if(data.TaskUnitBurnDown == metrics.TaskUnitBurnDown_max) {
         *                      return i;
         *                  }
         *              }
         *          }
         *      }];
         *
         * Object properties:
         *
         *   - The `field` property is the name of the field to use to calculate the new summary metric. This field
         *   can be from the data or from a previously derived field.
         *   - The `as` property is only used when you supply a custom function to calculate the summary metric. It is
         *   the name for future reference of the field.
         *   - The `f` property can be a built in Lumenize function string or a custom function that takes `seriesData`
         *   and `metrics` as arguments. This is used in conjunction with the `as` property.
         *
         * @return {Array}
         */
        getSummaryMetricsConfig: function () {
            return [];
        },

        /**
         * Calculate extra chart fields to display on the chart using the fields defined in by the summary metrics
         * configuration. This is passed to the {@link Rally.data.lookback.Lumenize.TimeSeriesCalculator} as
         * part of the configuration. This function is useful when you want to derive more fields to display on your
         * chart. For example, if you wanted to calculate an ideal line for a burn chart using the `TaskUnitScope_max`
         * field, you would specify:
         *      return [{
         *          "as": "Ideal",
         *          "f": function(snapshot, index, metrics, seriesData) {
         *              var max = metrics.TaskUnitScope_max,
         *                  increments = seriesData.length - 1,
         *                  incrementAmount = max / increments;
         *
         *              return Math.floor(100 * (max - index * incrementAmount)) / 100;
         *          },
         *          "display": "line"
         *      }];
         *
         * This field would be displayed in the chart as an ideal line for the given data.
         *
         * Object properties:
         *
         *   - The `as` property is the name displayed to the user in the chart
         *   - The `f` property is a custom function that takes a snapshot, index, chart metrics, and the series data as
         *   arguments
         *   - The `display` property is used by the chart to determine how to display the data on a chart. Can be any
         *   Highcharts specific type, e.g., "line" or "column"
         *
         * @return {Array}
         */
        getDerivedFieldsAfterSummary: function () {
            return [];
        },
        runCalculation: function (snapshots) {
            this.logger.log("runCalculations snapshots",snapshots.length, snapshots);
            
            var snaps_by_oid = Rally.technicalservices.Toolbox.aggregateSnapsByOid(snapshots);
            
            var series = this._getSeries(snaps_by_oid);

            return {categories: [], series: series};
        },
        _getSeries: function(snaps_by_oid, date_buckets){

           var blocked_durations = Rally.technicalservices.BlockedToolbox.getBlockedDurations(snaps_by_oid);
           var count_data = this.getCountsByReason(blocked_durations);
            
            this.data = count_data.data;  
            var series_data = []; 
            Ext.Object.each(count_data.counts, function(key,val){
                series_data.push([key,val]);
            },this);
            return [{type: 'pie', name: this.chartTitle, data: series_data}];
        },
        getCountsByReason: function(blocked_durations){
            var counts = {};
            var data = [];  
            Ext.each(blocked_durations, function(duration){
                if (duration.BlockedReason){
                    var globalReason = this._getGlobalReason(duration.BlockedReason);
                    count_key = Rally.technicalservices.Toolbox.getCaseInsensitiveKey(counts, globalReason);
                    if (counts[count_key] == undefined){
                        counts[count_key] = 0; 
                    } 
                    counts[count_key]++; 
                }
                data.push({FormattedID: duration.FormattedID, Name: duration.Name, BlockedReason: duration.BlockedReason});
            },this);
            return {counts: counts, data: data};  
        },
        getData: function(){
            return this.data;  
        },
        _getGlobalReason: function(reason){
            var match = /^(.*?) - (.*)/.exec(reason);
            if (match){
                return match[1].trim();
            }
            return reason;
        }
    });