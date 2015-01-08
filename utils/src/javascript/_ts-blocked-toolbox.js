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
    }
});