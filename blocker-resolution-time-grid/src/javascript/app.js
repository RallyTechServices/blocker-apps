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
   }
});