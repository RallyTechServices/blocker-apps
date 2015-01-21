Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box',layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    
    chartTitle: 'Blockers as a percentage of Work Items',
    pickerOptions: [
        {name: 'Last Complete Month', value: -1},
        {name: 'Last 2 Complete Months', value: -2},
        {name: 'Last 3 Complete Months', value: -3},
        {name: 'Last 6 Complete Months', value: -6},
        {name: 'Last 12 Complete Months', value: -12}
    ],
    types: ['HierarchicalRequirement','Defect'],
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
            itemId: 'btn-data',
            text: 'Data...',
            scope: this, 
            margin: '0 0 0 10',
            handler: this._viewData
        });
        this._buildChart(cb);
    }, 
    _viewData: function(){
        this.logger.log('_viewData');
        
        var data = this.down('#crt').calculator.getData();  
        var height = this.getHeight() || 500;
        var width = this.getWidth() || 800;
        
        if ( width > 800 ) {
            width = 800;
        }
        if ( height > 550 ) {
            height = 550;
        }
        if ( height < 200 ) {
            alert("The app panel is not tall enough to allow for displaying data.");
        } else {        
            Ext.create('Rally.technicalservices.DataExportDialog', {
                draggable: true,
                modal: true,
                width: width,
                height: height,
                autoShow: true,
                title: 'Data for ' + this.chartTitle,
                data: data
            });
        }
     },    
    _buildChart: function(cb){
        var project = this.getContext().getProject().ObjectID;  
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        this.logger.log('_buildChart', project, start_date);
        
        this.down('#display_box').removeAll();
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            itemId: 'crt',
            calculatorType:  'Rally.technicalservices.calculator.StateTouchCalculator',
            calculatorConfig: {
                startDate: start_date,
                endDate: new Date()
            },
            storeConfig: {
                fetch: ['Blocked','BlockedReason','Name','FormattedID'],
                limit: 'Infinity',
                find: {$and: [{"ScheduleState":"In-Progress"}, {'_ProjectHierarchy': project},{'_TypeHierarchy': {$in: this.types}},
                      {$or: [{
                          "_ValidFrom": {$gt: Rally.util.DateTime.toIsoString(start_date)}
                      },{
                          "__At": Rally.util.DateTime.toIsoString(start_date)
                      }]
                      }]
                } 
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
                        title: {text: ''},
                        max: 100,
                        labels: {
                            format: '{value}%'
                        }
                    },
                    plotOptions: {
                        column: {
                            stacking: "normal"
                        }
                    }
            }
        });
    }
});