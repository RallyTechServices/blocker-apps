    Ext.define("Rally.technicalservices.BlockedArtifact.Store", {
        extend : 'Ext.util.Observable',
        config: {
            startDate: null,
            endDate: new Date(),
            project: null,
            types: ['HierarchicalRequirement','Defect','Task'],
            hydrate: ['ScheduleState','State','_TypeHierarchy'],
            fetch: ['Blocked','BlockedReason','Blocker','ScheduleState','State','_TypeHierarchy'],
            compress: true, 
            find: {$or: [
               {"BlockedReason": {$exists: true}},
               {"_PreviousValues.BlockedReason": {$exists: true}}
            ]}
        },
        constructor: function(config){
            this.addEvents('artifactsloaded');       
            this.initConfig(config);
            this.callParent(arguments);
            this.loadArtifacts();
        },
        loadArtifacts: function(){
            var me = this; 
            this.find['_ValidFrom'] = {$gte: this.startDate};  
            
            Ext.create('Rally.data.lookback.SnapshotStore', {
                autoLoad: true,
                listeners: {
                    load: function(store, data, success) {
                        //process data
                        var processed_data = me._processData(data);
                        me.fireEvent('artifactsloaded', processed_data,success);
                    }
                },
                fetch: this.fetch,
                hydrate: this.hydrate,
                find: this.find,
                filters: [
                    {
                        property: '_TypeHierarchy',
                        operator: 'in',
                        value: this.types
                    },{
                        property: '_ProjectHierarchy',
                        operator: 'in',
                        value: [this.project]
                    }
                ],
                compress: this.compress 
            });
        },
        
        _processData: function(data){
            var stats = {};  
            Ext.each(data, function(snap){
                var obj_id = snap.get('ObjectID');
                if (stats[obj_id] == undefined){
                    stats[obj_id] = Ext.create('Rally.technicalservices.BlockedArtifact',snap);
                } else {
                    stats[obj_id].update(snap);
                }
            },this);
            return stats;
        }        
    });
