Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box',layout: {type: 'hbox'}},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    
    chartTitle: 'Blockers as a percentage of Work Items',
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
                select: this._buildChart  
            }
        });
        this._buildChart(cb);
    },
    
    _buildChart: function(cb){
        var project = this.getContext().getProject().ObjectID;  
        var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        this.logger.log('_buildChart', project, start_date);
        
        this.down('#display_box').removeAll();
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            calculatorType:  'Rally.technicalservices.calculator.StateTouchCalculator',
            calculatorConfig: {
                startDate: start_date,
                endDate: new Date()
            },
            storeConfig: {
                fetch: ['Blocked','BlockedReason'],
                find: {$and: [{"ScheduleState":"In-Progress"}, {'_ProjectHierarchy': project},
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