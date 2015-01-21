Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box', layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    dateFormat: "F",
    granularity: "month",
    hydrate: ['_TypeHierarchy'],
    types: ['HierarchicalRequirement','Defect','Task'],
    fetch: ['FormattedID', 'Name', 'Blocked','_PreviousValues.Blocked','BlockedReason','_PreviousValues.BlockedReason','_TypeHierarchy'],
    chartTitle: 'Historical Blocker Status',
    pickerOptions: [
                    {name: 'Last Complete Month', value: -1},
                    {name: 'Last 2 Complete Months', value: -2},
                    {name: 'Last 3 Complete Months', value: -3},
                    {name: 'Last 6 Complete Months', value: -6},
                    {name: 'Last 12 Complete Months', value: -12}
                ],
    defaultPickerOption: 'Last 3 Complete Months',
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
                        minWidth: 300,
                        value: -3,
                        listeners: {
                            scope: this,
                            select: this._buildChart  
                        }
                    });
                    
                    this.down('#selection_box').add({
                        xtype: 'rallybutton',
                        text: 'Data...',
                        itemId: 'btn-data',
                        margin: '0 0 0 10',
                        scope: this, 
                        handler: this._viewData,
                        //disabled: true
                    });

                    this._buildChart(cb);
    },    
    _viewData: function(){
        this.logger.log('_viewData');
        
        var data = this.down('#crt').calculator.getData();  
        Ext.create('Rally.technicalservices.DataExportDialog', {
            draggable: true,
            modal: true,
            autoShow: true,
            title: 'Data for ' + this.chartTitle,
            data: data
        });
    },
    _maskWindow: function(mask){
        this.down('#btn-data').setDisabled(mask);
        this.setLoading(mask);
    },
    _buildChart: function(cb){
        
        var start_date = Rally.technicalservices.Toolbox.getBeginningOfMonthAsDate(Rally.util.DateTime.add(new Date(), "month",cb.getValue()));
        var project = this.getContext().getProject().ObjectID; 

        this.logger.log('_buildChart', start_date, project);

        this.down('#display_box').removeAll(); 
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            itemId: 'crt',
            loadMask: false,
            storeConfig: {
                hydrate: this.hydrate,
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
                "_ValidFrom": {$gt: start_date},
                "_TypeHierarchy": {$in: this.types},
                "_ProjectHierarchy": {$in: [project]}
                },
                sort: {"_ValidFrom": 1} //sort ascending
            },
            calculatorType: 'Rally.technicalservices.calculator.BlockedArrivalKill',
            calculatorConfig: {
                granularity: this.granularity,
                dateFormat: this.dateFormat,
                startDate: start_date
            },
            chartConfig: {
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: this.chartTitle
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Blockers'
                        }
                    }
             }
        });
    }
});