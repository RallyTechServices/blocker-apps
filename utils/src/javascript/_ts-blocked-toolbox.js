Ext.define('Rally.technicalservices.BlockedToolbox',{
    singleton: true,
    getCountsByReason: function(snaps_by_oid){
        var counts = {};
        var data = [];  
        Ext.Object.each(snaps_by_oid, function(oid, snaps){
            var rec = {ObjectID: oid, BlockedReason: null, BlockedDate: null, UnblockedDate: null};
            Ext.each(snaps, function(snap){
                if (snap.BlockedReason){
                    if (counts[snap.BlockedReason] == undefined){
                        counts[snap.BlockedReason] = 0; 
                    } 
                    rec.BlockedReason = snap.BlockedReason;
                    counts[snap.BlockedReason]++; 
                }
            });
            data.push(rec);
        },this);
        return {counts: counts, data: data};  
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
    aggregateBlockedTimelines: function(snaps_by_oid){
        var export_data = [];  
        var reason_data = {};  
       
        //Assumption is that these snaps are still sorted by _ValidFrom in ascending order for each oid
        var block_action = {};  
        
        Ext.Object.each(snaps_by_oid, function(oid, snaps){
            var last_blocked_date = null;
            var blocked_actions = [];  
            var formatted_id = snaps[0].get('FormattedID');

            Ext.each(snaps, function(snap){
                var name = snap.get('Name');
                var reason = snap.get('BlockedReason') || null;
                var previous_reason = snap.get('_PreviousValues.BlockedReason') || null;
                var blocked = snap.get('Blocked');
                var was_blocked = snap.get('_PreviousValues.Blocked');
                var date = Rally.util.DateTime.fromIsoString(snap.get('_ValidFrom'));

                var rec = {FormattedID: formatted_id, BlockedDate: null, UnblockedDate: null, BlockedReason: null};
                if (blocked === true && was_blocked === false){
                    //Transition to blocked
                    last_blocked_date = date;
                    rec.BlockedDate = last_blocked_date;
                    rec.BlockedReason = reason;  
                    rec.Name = name; 
                    blocked_actions.push(rec);
                }
                
                if (was_blocked === true && blocked === false){
                    //Transition from blocked 
                    var rec_found = false; 
                    var idx=-1; 
                    for (var i=0; i<blocked_actions.length; i++){
                        if (blocked_actions[i].BlockedDate == last_blocked_date){
                            idx = i;  
                        }
                    }

                    if (idx<0){
                        idx = blocked_actions.length; 
                        blocked_actions.push(rec);  
                    }
                    blocked_actions[idx].Name = name;  
                    blocked_actions[idx].UnblockedDate = date;  
                    blocked_actions[idx].BlockedReason = previous_reason;  
                    last_blocked_date = null; 
                }
            });
            block_action[formatted_id] = blocked_actions;
        });
        return block_action         
    },
//    getDateBucketsForArtifacts: function(artifacts, artifactProperties, dateInterval, dateFormat){
//        var earliest_date = new Date();
//        var latest_date = Rally.util.DateTime.add(earliest_date,"year",-20);
//        
//        Ext.Object.each(artifacts,function(key,artifact){
//            Ext.each(artifactProperties, function(prop){
//                if (artifact[prop]){
//                    var date = Rally.util.DateTime.fromIsoString(artifact[prop]);
//                    if (date < earliest_date){
//                        earliest_date = date; 
//                    }
//                    if (date > latest_date){
//                        latest_date = date;
//                    }                
//                }
//            })
//        });
//        
//        var buckets = [];
//        var date = earliest_date; 
//        while (date < latest_date && earliest_date < latest_date){
//            var bucket = Rally.util.DateTime.format(date,dateFormat);
//            console.log(date, bucket);
//            if (!Ext.Array.contains(buckets, bucket)){
//                buckets.push(bucket);
//            }
//            date = Rally.util.DateTime.add(date,dateInterval,1);
//        }
//        return buckets;
//    },
//    getStatistics: function(artifacts){
//        //Mean, Min, Max, Totals
//        var reasons = this.getUniquePropertyValues(artifacts,"blockedReason");
//        var daysToResolution = {};  
//        Ext.each(reasons, function(reason){
//            daysToResolution[reason] = [];
//        });
//        
//        Ext.Object.each(artifacts, function(key,artifact){
//            if (artifact.blockedReason && artifact.unblockedDate){
//                daysToResolution[artifact.blockedReason].push(artifact.getDaysToResolution());
//            }
//        },this);
//        
//        var data = [];
//        var total = 0;
//        Ext.Object.each(daysToResolution, function(key,val){
//            total += val.length;
//            data.push({reason: key, mean: Ext.Array.mean(val), min: Ext.Array.min(val), max: Ext.Array.max(val), total: val.length});
//        });
//        
//        var all = _.flatten(_.values(daysToResolution));
//        data.push({reason: 'All', mean: Ext.Array.mean(all), min: Ext.Array.min(all), max: Ext.Array.max(all), total: total});
//        return data;
//    },
//    getUniquePropertyValues: function(artifacts, property, transformFn){
//        
//        var unique_values = [];  
//        console.log(transformFn);
//        if (transformFn == undefined){
//            transformFn = function(val){return val;}
//        }
//        console.log('fn',transformFn);
//        Ext.Object.each(artifacts, function(key,artifact){
//            console.log(artifact, artifact[property]);
//            if (artifact[property]){
//                var val = transformFn(artifact[property]);
//                console.log('val',val,Ext.Array.contains(unique_values, val));
//                if (!Ext.Array.contains(unique_values, val)){
//                    unique_values.push(val);
//                }
//            }
//        });
//        return unique_values.sort(); 
//    }
});