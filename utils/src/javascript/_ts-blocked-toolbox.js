Ext.define('Rally.technicalservices.BlockedToolbox',{
    singleton: true,
    /**
     * getBlockedDurations
     *   
     * Returns an array of objects that represent one blocked duration for an artifact and include the following properties:
     *     FormattedID
     *     Name
     *     DateBlocked
     *     DateUnblocked
     *     BlockedReason
     *     
     * Assumes the minimal fetch list:  
     *     Name
     *     FormattedID
     *     _ValidFrom
     *     Blocked
     *     BlockedReason
     *     _PreviousValues.Blocked
     *     _PreviousValues.BlockedReason
     *  
     * Also assumes snapshots are sorted by _ValidFrom in ascending order 
     * 
     */
    getBlockedDurations: function(snaps_by_oid){
        
        var data = [];
        
        Ext.Object.each(snaps_by_oid, function(oid, snaps){
            
            var last_blocked_time = null; 
            var data_record = {FormattedID: null, Name: null, BlockedReason: null, BlockedDate: null, UnblockedDate: null};
            
            Ext.each(snaps, function(snap){
                data_record.FormattedID = snap.FormattedID ;
                data_record.Name = snap.Name ; 
                var is_blocked = snap.Blocked ;
                var was_blocked = is_blocked;  
                if (snap._PreviousValues && (snap._PreviousValues.Blocked != undefined)){
                    was_blocked =  snap._PreviousValues.Blocked;
                } else if (snap["_PreviousValues.Blocked"] != null){
                    was_blocked = snap["_PreviousValues.Blocked"];
                }
                
                var reason = snap.BlockedReason || ''; 
                
                var prev_reason = '';  
                if (snap._PreviousValues && (snap._PreviousValues.BlockedReason != undefined)) {
                    prev_reason = snap._PreviousValues.BlockedReason;
                } else if (snap["_PreviousValues.BlockedReason"]){
                    prev_reason = snap["_PreviousValues.BlockedReason"];
                }
                
                var date = Rally.util.DateTime.fromIsoString(snap._ValidFrom);
                if (was_blocked && prev_reason.length > 0 && (is_blocked == false)){
                    data_record.UnblockedDate = date; 
                    data_record.BlockedReason = prev_reason; 
                    data.push(data_record);  //We push this here so that we can start a new one.  
                    data_record = {FormattedID: snap.FormattedID, Name: snap.Name, BlockedReason: null, BlockedDate: null, UnblockedDate: null};
                    last_blocked_time = null;  
                } 
                
                if (is_blocked && (was_blocked == false)){
                    last_blocked_time = date; 
                }
                if (is_blocked && reason.length > 0 && last_blocked_time){
                    data_record.BlockedReason = reason; 
                    data_record.BlockedDate = last_blocked_time;
//                    last_blocked_time = null;  
                }
            },this);
            
            if (data_record.BlockedDate && data_record.UnblockedDate == null){
                data.push(data_record);
            }
        },this);
        return data;  
    },
    getCountsByReason: function(snaps_by_oid){
        var counts = {};
        var data = [];  
        Ext.Object.each(snaps_by_oid, function(oid, snaps){
            var rec = {FormattedID: null, Name: null, BlockedReason: null};
            Ext.each(snaps, function(snap){
                rec.Name = snap.Name;  
                rec.FormattedID = snap.FormattedID;
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

        Ext.each(bucketedDateStrings, function(str){
            buckets[str] = 0;
        });
        
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
    }
});