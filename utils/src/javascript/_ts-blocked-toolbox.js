Ext.define('Rally.technicalservices.BlockedToolbox',{
    singleton: true,
    getCountsByReason: function(artifacts){
        var counts = {};
        Ext.Object.each(artifacts, function(key, artifact){
            if (artifact.blockedReason){
                if (counts[artifact.blockedReason] == undefined){
                    counts[artifact.blockedReason] = 0; 
                } 
                counts[artifact.blockedReason]++; 
            }
        },this);
        return counts;  
    },
    bucketDataByDate: function(artifacts, artifactProperty, dateInterval, dateFormat, bucketedDateStrings){
        var buckets = {};
        console.log(bucketedDateStrings);
        Ext.each(bucketedDateStrings, function(str){
            buckets[str] = 0;
        });
        console.log(buckets);
        
        Ext.Object.each(artifacts, function(key, artifact){
            if (artifact[artifactProperty]){
                var date = Rally.util.DateTime.fromIsoString(artifact[artifactProperty]);
                var bucket = Rally.util.DateTime.format(date,dateFormat);
                if (Ext.Array.contains(bucketedDateStrings,bucket)){
                    buckets[bucket]++;
                }
            }
        });
        
        return buckets;  
    },
    getDateBuckets: function(startDate, endDate, granularity){
        console.log('_getDateBuckets',startDate,endDate,granularity);
        var start_year = startDate.getFullYear();
        var start_month = startDate.getMonth();
        var start_day = startDate.getDate();  
        if (granularity == "month"){
            start_day = 1; 
        }
        
        var end_year = endDate.getFullYear();
        var end_month = endDate.getMonth();
        var end_day = endDate.getDate() + 1; 
        if (granularity == "month"){
            //months are zero-based and 0 day returns the last day of the previous month
            end_day = new Date(end_year, end_month+1,0).getDate();
        }
        console.log(end_year,end_month,end_day);
        var bucketStartDate = new Date(start_year,start_month,start_day,0,0,0,0);
        var bucketEndDate = new Date(end_year,end_month,end_day,0,0,0,0);
        var date = bucketStartDate;
        
        var buckets = []; 
        console.log(bucketEndDate, bucketStartDate);
        while (date<bucketEndDate && bucketStartDate < bucketEndDate){
            buckets.push(date);
            date = Rally.util.DateTime.add(date,granularity,1);
        }
        return buckets;  
    },
    formatCategories: function(buckets, dateFormat){
        var categories = [];
        Ext.each(buckets, function(bucket){
            categories.push(Rally.util.DateTime.format(bucket,dateFormat));
        });
        return categories; 
    },
    getDateBucketsForArtifacts: function(artifacts, artifactProperties, dateInterval, dateFormat){
        var earliest_date = new Date();
        var latest_date = Rally.util.DateTime.add(earliest_date,"year",-20);
        
        Ext.Object.each(artifacts,function(key,artifact){
            Ext.each(artifactProperties, function(prop){
                if (artifact[prop]){
                    var date = Rally.util.DateTime.fromIsoString(artifact[prop]);
                    if (date < earliest_date){
                        earliest_date = date; 
                    }
                    if (date > latest_date){
                        latest_date = date;
                    }                
                }
            })
        });
        
        var buckets = [];
        var date = earliest_date; 
        while (date < latest_date && earliest_date < latest_date){
            var bucket = Rally.util.DateTime.format(date,dateFormat);
            console.log(date, bucket);
            if (!Ext.Array.contains(buckets, bucket)){
                buckets.push(bucket);
            }
            date = Rally.util.DateTime.add(date,dateInterval,1);
        }
        return buckets;
    },
    getStatistics: function(artifacts){
        //Mean, Min, Max, Totals
        var reasons = this.getUniquePropertyValues(artifacts,"blockedReason");
        var daysToResolution = {};  
        Ext.each(reasons, function(reason){
            daysToResolution[reason] = [];
        });
        
        Ext.Object.each(artifacts, function(key,artifact){
            if (artifact.blockedReason && artifact.unblockedDate){
                daysToResolution[artifact.blockedReason].push(artifact.getDaysToResolution());
            }
        },this);
        
        var data = [];
        var total = 0;
        Ext.Object.each(daysToResolution, function(key,val){
            total += val.length;
            data.push({reason: key, mean: Ext.Array.mean(val), min: Ext.Array.min(val), max: Ext.Array.max(val), total: val.length});
        });
        
        var all = _.flatten(_.values(daysToResolution));
        data.push({reason: 'All', mean: Ext.Array.mean(all), min: Ext.Array.min(all), max: Ext.Array.max(all), total: total});
        return data;
    },
    getUniquePropertyValues: function(artifacts, property, transformFn){
        
        var unique_values = [];  
        console.log(transformFn);
        if (transformFn == undefined){
            transformFn = function(val){return val;}
        }
        console.log('fn',transformFn);
        Ext.Object.each(artifacts, function(key,artifact){
            console.log(artifact, artifact[property]);
            if (artifact[property]){
                var val = transformFn(artifact[property]);
                console.log('val',val,Ext.Array.contains(unique_values, val));
                if (!Ext.Array.contains(unique_values, val)){
                    unique_values.push(val);
                }
            }
        });
        return unique_values.sort(); 
    }
});