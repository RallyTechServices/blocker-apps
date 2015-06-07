Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box', layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    pickerOptions: [
                    {name: 'Last Complete Month', value: -1},
                    {name: 'Last 2 Complete Months', value: -2},
                    {name: 'Last 3 Complete Months', value: -3},
                    {name: 'Last 6 Complete Months', value: -6},
                    {name: 'Last 12 Complete Months', value: -12}
                ],
    defaultPickerOption: 'Last 3 Complete Months',
    /**
     * Store Config
     */
    types: ['HierarchicalRequirement','Defect','Task'],
    hydrate: ['_TypeHierarchy'],
    fetch: ['FormattedID', 'Name', 'Blocked','BlockedReason','_PreviousValues.BlockedReason','_PreviousValues.Blocked'], 

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
            minWidth: 300,
            listeners: {
                scope: this,
                select: this._fetchData  
            }
        });
        this.down('#selection_box').add({
            xtype: 'rallybutton',
            itemId: 'btn-export',
            text: 'Export',
            margin: '0 0 0 10',
            scope: this, 
            handler: this._exportData
        });
        this._fetchData(cb);
    },    
    _fetchData: function(cb){
        var start_date = Rally.util.DateTime.toIsoString(Rally.util.DateTime.add(new Date(),"month",cb.getValue()));
        var project = this.getContext().getProject().ObjectID;  
        
        this.logger.log('_fetchData',project,start_date);
        var store = Ext.create('Rally.data.lookback.SnapshotStore', {
            exceptionHandler: function (proxy, response, operation) {
                if (response == null) {
                    self.queryValid = false;
                } else {
                    if (response && response.status !== 200) {
                        self.queryValid = false;
                    } 
                    if (response && response.status === 409) {
                        self.workspaceHalted = true;
                    } else if (response && response.status === 503) {
                        self.serviceUnavailable = true;
                    }
                }
            },
            fetch: this.fetch,
            compress: true, 
            limit: 'Infinity',
            find: {
               $or: [
                     {"BlockedReason": {$exists: true}},
                     {"_PreviousValues.BlockedReason": {$exists: true}},
                     {"Blocked": true},
                     {"_PreviousValues.Blocked": true}
               ],
               "_ValidTo": {$gte: start_date},
               "_TypeHierarchy": {$in: this.types},
               "_ProjectHierarchy": {$in: [project]}
            },
            removeUnauthorizedSnapshots: true,
            sort: "_ValidFrom",
        });
        store.on('load', this._mungeDataAndBuildGrid, this);
        store.load({params: { removeUnauthorizedSnapshots: true }});
    },
    _mungeDataAndBuildGrid: function(store, data, success){
        this.logger.log('_mungeDataAndBuildGrid',data);
        
        var snaps_by_oid = Rally.technicalservices.Toolbox.aggregateSnapsByOidForModel(data);
        var processed_data = this._processData(snaps_by_oid);
        var statistics_data = this._calculateStatistics(processed_data);
        this._buildGrid(statistics_data);
    },  
    _processData: function(snaps_by_oid){
       var blocked_durations  = Rally.technicalservices.BlockedToolbox.getBlockedDurations(snaps_by_oid);
        
        var export_data = [];  
        var reason_data = {};  
        this.logger.log('_processData',snaps_by_oid, blocked_durations);
        Ext.each(blocked_durations, function(duration){
            export_data.push(duration);
            if (duration.BlockedReason && duration.BlockedReason.length > 0 && duration.BlockedDate && duration.UnblockedDate){
                var global_reason = this._getGlobalReason(duration.BlockedReason);
                var key= Rally.technicalservices.Toolbox.getCaseInsensitiveKey(reason_data, global_reason);
                
                if (reason_data[key] == undefined){
                    reason_data[key] = [];
                }
                var daysToResolution = Math.ceil(Rally.util.DateTime.getDifference(duration.UnblockedDate, duration.BlockedDate,"minute")/1440);
                 reason_data[key].push(daysToResolution);
            }
        },this);
        this.exportData = export_data; 
        return reason_data; 
    },
    _getGlobalReason: function(reason){
        var match = /^(.*?) - (.*)/.exec(reason);
        if (match){
            return match[1].trim();
        }
        return reason;
    },
    _calculateStatistics: function(processed_data){
        //Mean, Min, Max, Totals
        var data = [];
        var total = 0;
        Ext.Object.each(processed_data, function(key,val){
            total += val.length;
            data.push({reason: key, mean: Math.round(Ext.Array.mean(val)), min: Math.round(Ext.Array.min(val)), max: Math.round(Ext.Array.max(val)), total: val.length});
        });
        
        var all = _.flatten(_.values(processed_data));
        data.push({reason: 'All', mean: Math.round(Ext.Array.mean(all)), min: Math.round(Ext.Array.min(all)), max: Math.round(Ext.Array.max(all)), total: total});
        return data;        
    }, 
   _exportData: function(){
       var file_name = "blocker-resolution-time-export.csv";
       var data_hash = {};
       Ext.each(Ext.Object.getKeys(this.exportData[0]), function(key){
           data_hash[key] = key;
       });
       this.logger.log('_export',data_hash, this.exportData);
       
       var export_text = Rally.technicalservices.FileUtilities.convertDataArrayToCSVText(this.exportData, data_hash);
       Rally.technicalservices.FileUtilities.saveTextAsFile(export_text,file_name);
   },
   _buildGrid: function(data){
       
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