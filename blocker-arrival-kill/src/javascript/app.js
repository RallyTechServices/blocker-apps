Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box', layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    
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
                        value: -3,
                        listeners: {
                            scope: this,
                            select: this._buildChartNew  
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

                    this._buildChartNew(cb);
    },    
    _viewData: function(){
        this.logger.log('_viewData');
        
        var data = this.down('#crt').calculator.getData();  
        Ext.create('Rally.technicalservices.DataExportDialog', {
            draggable: true,
            modal: true,
            autoShow: true,
            title: 'Data Dialog 2',
            data: data
        });
    },
    _maskWindow: function(mask){
        this.down('#btn-data').setDisabled(mask);
        this.setLoading(mask);
    },
    _fetchData: function(cb){

        this._maskWindow(true);
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        this.logger.log('_fetchData', start_date, project);
        Ext.create('Rally.technicalservices.BlockedArtifact.Store',{
            startDate: start_date,
            project: project,
            listeners: {
                scope: this,
                artifactsloaded: function(blockedArtifacts,success){
                    this.logger.log('artifactsLoaded', blockedArtifacts, success);
                    this._buildChart(blockedArtifacts,start_date);
                    this._maskWindow(false);
                }
            }
        });
    },
    _buildChartNew: function(cb){
        
        var start_date = Rally.technicalservices.Toolbox.getBeginningOfMonthAsDate(Rally.util.DateTime.add(new Date(), "month",cb.getValue()));
        var project = this.getContext().getProject().ObjectID; 

        var types = ['HierarchicalRequirement','Defect','Task'];
        var dateFormat = "F";
        var dateInterval = "month";

        this.logger.log('_buildChart', start_date, project);

        this.down('#display_box').removeAll(); 
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            itemId: 'crt',
            loadMask: false,
            storeConfig: {
                hydrate: ['_TypeHierarchy'],
                fetch: ['Blocked','_PreviousValues.Blocked','BlockedReason','_PreviousValues.BlockedReason','_TypeHierarchy'],
                compress: true, 
                find: {
                $or: [
                      {"BlockedReason": {$exists: true}},
                      {"_PreviousValues.BlockedReason": {$exists: true}},
                      {"Blocked": true},
                      {"_PreviousValues.Blocked": true}
                ],
                "_ValidFrom": {$gt: start_date},
                "_TypeHierarchy": {$in: types},
                "_ProjectHierarchy": {$in: [project]}
                },
                sort: {"_ValidFrom": 1} //sort ascending
            },
            calculatorType: 'Rally.technicalservices.calculator.BlockedArrivalKill',
            calculatorConfig: {
                granularity: "month",
                dateFormat: "F",
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
    },   
    _buildChart: function(artifacts,startDate){
        this.logger.log('_buildChart artifacts', artifacts);

        this.down('#display_box').removeAll(); 
        
        var dateFormat = "F";
        var dateInterval = "month";
        
//        var categories = Rally.technicalservices.BlockedToolbox.getDateBucketsForArtifacts(artifacts, ["blockedDate","unblockedDate"], dateInterval, dateFormat);
        
        var categories = Rally.technicalservices.BlockedToolbox.getDateBuckets(startDate, new Date(), dateInterval);
        categories = Rally.technicalservices.BlockedToolbox.formatCategories(categories, dateFormat);
        var new_blockers = Rally.technicalservices.BlockedToolbox.bucketDataByDate(artifacts,"blockedDate",dateInterval,dateFormat,categories);
        var resolved_blockers = Rally.technicalservices.BlockedToolbox.bucketDataByDate(artifacts,"unblockedDate",dateInterval,dateFormat,categories);
        
        this.logger.log('_buildChart blocker data (new, resolved)', new_blockers, resolved_blockers);
 
        var series = [];
        var nb_data = [], rb_data = []; 
        Ext.each(categories, function(category){
            nb_data.push(new_blockers[category]);
            rb_data.push(resolved_blockers[category]);
        },this);
        series.push({name: "New Blockers", data: nb_data});
        series.push({name: "Resolved Blockers", data: rb_data});
        
        this.logger.log('_buildChart', 'categories',categories,'series', series);
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            loadMask: false,
            chartData: {
                series: series,
                categories: categories
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