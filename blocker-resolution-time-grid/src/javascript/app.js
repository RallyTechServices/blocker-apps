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
    fetch: ['FormattedID', 'Name', 'Blocked','BlockedReason','_TypeHierarchy','_PreviousValues.BlockedReason','_PreviousValues.Blocked'], 

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
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                scope: this, 
                load: function(store, data, success){ 
                    var snaps_by_oid = Rally.technicalservices.Toolbox.aggregateSnapsByOid(data);
                    var processed_data = this._processData(snaps_by_oid)
;                   var statistics_data = this._calculateStatistics(processed_data);
                    this._buildGrid(statistics_data);
                }
            },
            hydrate: this.hydrate,
            fetch: this.fetch,
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
                    value: this.types
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
    _processData: function(snaps_by_oid){
        var blocked_data = Rally.technicalservices.BlockedToolbox.aggregateBlockedTimelines(snaps_by_oid);
        this.logger.log('_processData', blocked_data);
        
        var export_data = [];  
        var reason_data = {};  
        this.logger.log('_processData',blocked_data);
        Ext.Object.each(blocked_data, function(formatted_id, blocks){
            Ext.each(blocks, function(block){
                export_data.push(block);
                if (block.BlockedReason && block.BlockedReason.length > 0 && block.BlockedDate && block.UnblockedDate){
                    if (reason_data[block.BlockedReason] == undefined){
                        reason_data[block.BlockedReason] = [];
                    }
                    var daysToResolution = Rally.util.DateTime.getDifference(block.UnblockedDate, block.BlockedDate,"day");
                    reason_data[block.BlockedReason].push(daysToResolution);
                }
            });
        });
        this.exportData = export_data; 
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
   _exportData: function(){
       var file_name = "export.csv";
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