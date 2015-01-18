Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    pickerOptions: [
                    {name: 'Last Month', value: -1},
                    {name: 'Last 2 Months', value: -2},
                    {name: 'Last 3 Months', value: -3},
                    {name: 'Last 6 Months', value: -6},
                    {name: 'Last 12 Months', value: -12}
                ],
    defaultPickerOption: 'Last 3 Months',
    launch: function() {
        this._initialize();
    },
    _initialize: function(){
        var store = Ext.create('Ext.data.Store',{
            fields: ['name','value'],
            data: this.pickerOptions
        });
        
        var cb = this.down('#selection_box').add({
            xtype: 'combobox',
            store: store,
            queryMode: 'local',
            fieldLabel: 'Show data from',
            labelAlign: 'right',
            displayField: 'name',
            valueField: 'value',
            value: -3,
            listeners: {
                scope: this,
                select: this._fetchData  
            }
        });
        this._fetchData(cb);
    },    
    _fetchDataNew: function(cb){
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                scope: this, 
                load: function(store, data, success) {
                    //process data
                      //this._buildGrid(data)
                      var processed_data = this._processData(data);
                    console.log(processed_data);
                    var statistics_data = this._calculateStatistics(processed_data);
                    console.log(statistics_data)
                    this._buildGrid(statistics_data);
                }
            },
            hydrate: ['_TypeHierarchy'],
            fetch: ['Blocked','BlockedReason','_TypeHierarchy','_PreviousValues.BlockedReason','_PreviousValues.Blocked'],
            compress: true, 
            find: {
               $or: [
                     {"BlockedReason": {$exists: true}},
                     {"_PreviousValues.BlockedReason": {$exists: true}}
               ],
               $or: [
                     {"_ValidFrom": {$gte: start_date}},
                     {"__At": start_date}
                ]
            },
            filters: [
                {
                    property: '_TypeHierarchy',
                    operator: 'in',
                    value: ['HierarchicalRequirement','Defect','Task']
                },{
                    property: '_ProjectHierarchy',
                    operator: 'in',
                    value: [project]
                }
            ],
            sort: "_ValidFrom",
            compress: true 
        });

    },
    _processData: function(data){
        var snaps_by_oid = {};  
        Ext.each(data, function(snap){
            var obj_id = snap.get('ObjectID');
            if (snaps_by_oid[obj_id] == undefined){
                snaps_by_oid[obj_id] = [];  
            }
            snaps_by_oid[obj_id].push(snap);  
        },this);
        
        var export_data = [];  
        var reason_data = {};  
        Ext.Object.each(snaps_by_oid, function(oid, snaps){
            var temp_reasons = {}; 
            //Assumption is that these snaps are still sorted by _ValidFrom in ascending order
            Ext.each(snaps, function(snap){
                var reason = snap.get('BlockedReason');
                var previous_reason = snap.get('_PreviousValues.BlockedReason');
                var date = Rally.util.DateTime.fromIsoString(snap.get('_ValidFrom'));
                var blocked = snap.get('Blocked');
                console.log(oid, reason,previous_reason,date,blocked);
                if ((previous_reason && previous_reason.length > 0 && previous_reason != reason)){
                    //End for previous reason
                    if (temp_reasons[previous_reason] == undefined){
                        temp_reasons[previous_reason]= {startDate: null, endDate: null};
                    }
                    if (temp_reasons[previous_reason].endDate == null || temp_reasons[previous_reason].endDate < date){
                        temp_reasons[previous_reason].endDate = date;  
                    }
                }
                if (reason && reason.length > 0 && reason != previous_reason){
                    //Start for reason, only if it didn't start earlier
                    if (temp_reasons[reason] == undefined){
                        temp_reasons[reason]=  {startDate: null, endDate: null};
                    } 
                    if (temp_reasons[reason].startDate == null || temp_reasons[reason].startDate > date){
                        temp_reasons[reason] = date;  
                    } 
                }
            });
            Ext.Object.each(temp_reasons, function(reason, obj){
                if (obj.startDate && obj.endDate){
                    if (reason_data[reason] == undefined){
                        reason_data[reason] = [];
                    }
                    var daysToResolution = Rally.util.DateTime.getDifference(obj.endDate, obj.StartDate,"day");
                    reason_data[reason].push(daysToResolution);
                }
            });
        });
        return reason_data; 
    },
    _calculateStatistics: function(processed_data){
        //Mean, Min, Max, Totals
        var data = [];
        var total = 0;
        Ext.Object.each(processed_data, function(key,val){
            total += val.length;
            data.push({reason: key, mean: Ext.Array.mean(val), min: Ext.Array.min(val), max: Ext.Array.max(val), total: val.length});
        });
        
        var all = _.flatten(_.values(processed_data));
        data.push({reason: 'All', mean: Ext.Array.mean(all), min: Ext.Array.min(all), max: Ext.Array.max(all), total: total});
        return data;        
    }, 
    _fetchData: function(cb){
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        Ext.create('Rally.technicalservices.BlockedArtifact.Store',{
            startDate: start_date,
            project: project,
            listeners: {
                scope: this,
                artifactsloaded: function(blockedArtifacts,success){
                    this.logger.log('artifactsLoaded', blockedArtifacts, success);
                    this._buildGrid(blockedArtifacts);
                }
            }
        });
        
    },
    _buildGrid: function(blockedArtifacts){
        
        this.down('#display_box').removeAll();
        
        var data = Rally.technicalservices.BlockedToolbox.getStatistics(blockedArtifacts);
        var store = Ext.create('Rally.data.custom.Store',{
            data: data
        });
        
        var columnCfgs = [];
        Ext.each(_.keys(data[0]), function(key){
            columnCfgs.push({text: key, dataIndex: key});
        });
        columnCfgs[0]['flex'] = 1;  
        
        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: columnCfgs
        });
    },

   _buildGridNew: function(data){
       
       var data = 
       this.down('#display_box').removeAll();
       
       var store = Ext.create('Rally.data.custom.Store',{
           data: data
       });
       
       var columnCfgs = [];
       Ext.each(_.keys(data[0]), function(key){
           columnCfgs.push({text: key, dataIndex: key});
       });
       columnCfgs[0]['flex'] = 1;  
       
       this.down('#display_box').add({
           xtype: 'rallygrid',
           store: store,
           columnCfgs: columnCfgs
       });
   }
});