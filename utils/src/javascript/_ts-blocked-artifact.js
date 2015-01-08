    Ext.define("Rally.technicalservices.BlockedArtifact", {

        objectID: 0,
        artifactType: null,
        blockedDate: null,
        unblockedDate: null,
        blockedReason: null,
        blockedDateState: null,
        unblockedDateState: null, 
        blockedReason: null,
        blocker: 0, 
        
        constructor: function(snapshot){
            this.objectID = snapshot.get('ObjectID');
            this.artifactType = snapshot.get('_TypeHierarchy').splice(-1)[0];
            this.update(snapshot);
        },
        update: function(snapshot){
            
            var blocked = snapshot.get('Blocked');
            var snap_date = snapshot.get('_ValidFrom');
            var state = snapshot.get('ScheduleState') || snapshot.get('State');
            
            if (blocked && ((this.blockedDate == null)||(this.blockedDate < snap_date))){
                this.blockedDate = snap_date;  
                this.blockedReason = snapshot.get('BlockedReason');
                this.blocker = snapshot.get('Blocker');
                this.blockedDateState = state;
                
            } else if (blocked == false && ((this.unblockedDate == null)||(this.unblockedDate > snap_date))) {
                    this.unblockedDate = snap_date;  
                    this.unblockedDateState = state;
            }            
        }
    });