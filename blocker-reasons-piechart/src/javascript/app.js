Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'selection_box', layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'time_box', layout: {type: 'hbox'}, padding: 10},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    chartTitle: 'Blocker Causes',
    types: ['HierarchicalRequirement','Defect','Task'],
    fetch: ['FormattedID','Name','Blocked','BlockedReason','_PreviousValues.Blocked','_PreviousValues.BlockedReason','_TypeHierarchy'],
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

        var me = this;

        var store = Ext.create('Ext.data.Store',{
            fields: ['name','value'],
            data: this.pickerOptions
        });
        
        this.down('#selection_box').add(
        {
            xtype      : 'radiogroup',
            fieldLabel : 'Select data for ',
            layout: 'hbox',
            items: [
                {
                    boxLabel  : 'Time Period',
                    name      : 'timebox',
                    inputValue: 'T',
                    id        : 'radio1',
                    checked   : true,
                    margin: '0 0 0 10'
                }, 
                {
                    boxLabel  : 'Iteration',
                    name      : 'timebox',
                    inputValue: 'I',
                    id        : 'radio2',   
                    margin: '0 0 0 10'
                }, 
                {
                    boxLabel  : 'Release',
                    name      : 'timebox',
                    inputValue: 'R',
                    id        : 'radio3',   
                    margin: '0 0 0 10'
                }
            ],
            listeners:{
                change: function(rb){
                    if(rb.lastValue.timebox == 'T'){
                        me.down('#time_box').removeAll();
                            me.down('#time_box').add({
                                xtype: 'combobox',
                                store: store,
                                queryMode: 'local',
                                fieldLabel: 'Show data from',
                                displayField: 'name',
                                valueField: 'value',
                                minWidth: 300,
                                value: -3,
                                name:'TimePeriod',
                                listeners: {
                                    scope: me,
                                    select: me._buildChart,
                                    ready:me._buildChart
                                }
                            });
                            
                    }else if(rb.lastValue.timebox == 'I'){
                            //console.log('me>>',me);
                            me.down('#time_box').removeAll();
                            me.down('#time_box').add({
                                xtype: 'rallyiterationcombobox',
                                fieldLabel: 'Iteration: ',
                                minWidth: 300,
                                listeners: {
                                    scope: me,
                                    select: function(icb){
                                        me._getReleaseOrIterationOids(icb);
                                    },
                                    ready: function(icb){
                                        me._getReleaseOrIterationOids(icb);
                                    }
                                }
                            });

                    }else if(rb.lastValue.timebox == 'R'){
                            me.down('#time_box').removeAll();
                            me.down('#time_box').add({
                                xtype: 'rallyreleasecombobox',
                                fieldLabel: 'Release: ',
                                minWidth: 300,
                                value: -3,
                                listeners: {
                                    scope: me,
                                    select: function(icb){
                                        me._getReleaseOrIterationOids(icb);
                                    },
                                    ready: function(icb){
                                        me._getReleaseOrIterationOids(icb);
                                    }                                
                                }
                            });
                    }
                }
            }
        }
        );

        var cb = this.down('#time_box').add({
            xtype: 'combobox',
            store: store,
            queryMode: 'local',
            fieldLabel: 'Show data from',
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

    _getReleaseOrIterationOids: function(cb) {
        var me = this;
        me.logger.log('_getReleaseOrIterationOids',cb);
        me.timeboxValue = cb;
        Deft.Chain.parallel([
                me._getReleasesOrIterations
        ],me).then({
            scope: me,
            success: function(results) {
                me.logger.log('Results:',results);
                
                me.timebox_oids = Ext.Array.map(results[0], function(timebox) {
                    return timebox.get('ObjectID');
                });
                me._buildChart(cb);
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem Loading Timebox data', msg);
            }
        });
    },


    _getReleasesOrIterations:function(){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        this.logger.log('_getReleasesOrIterations>>',me.timeboxValue);

        var timeboxModel = '';
        var filters = [];

        if(me.timeboxValue.name == 'Iteration'){
            timeboxModel = 'Iteration';
            filters =         [        {
                    property: 'Name',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('Name')
                }
                ,
                {
                    property: 'StartDate',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('StartDate').toISOString()
                },
                {
                    property: 'EndDate',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('EndDate').toISOString()
                }
            ];
        }else if(me.timeboxValue.name == 'Release'){
            timeboxModel = 'Release';  
            filters =         [        {
                    property: 'Name',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('Name')
                }
                ,
                {
                    property: 'ReleaseStartDate',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('ReleaseStartDate').toISOString()
                },
                {
                    property: 'ReleaseDate',
                    operator: '=',
                    value: me.timeboxValue.getRecord().get('ReleaseDate').toISOString()
                }
            ];
        }

        Ext.create('Rally.data.wsapi.Store', {
            model: timeboxModel,
            fetch: ['ObjectID'],
            filters: Rally.data.wsapi.Filter.and(filters)
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    //console.log('records',records,'operation',operation,'successful',successful);
                    deferred.resolve(records);
                } else {
                    me.logger.log("Failed: ", operation);
                    deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                }
            }
        });
        return deferred.promise;
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
        var me = this;

        var start_date , end_date = new Date();
        //var start_date = Rally.util.DateTime.add(new Date(),"month",cb.getValue());
        var project = this.getContext().getProject().ObjectID;  
        
        this.down('#display_box').removeAll();
        
        var find = {$or: [
                             {"BlockedReason": {$exists: true}},
                             {"_PreviousValues.BlockedReason": {$exists: true}},
                             {"Blocked": true},
                             {"_PreviousValues.Blocked": true}
                      ],
                };

        //this.logger.log('_buildCharts', start_date, project);

        if(cb.name == 'Iteration'){
            find["Iteration"] = { '$in': this.timebox_oids };
            if(me.timeboxValue){
                start_date = new Date(me.timeboxValue.getRecord().get('StartDate'));
                end_date = new Date(me.timeboxValue.getRecord().get('EndDate'));
            }

        }else if(cb.name == 'Release'){
            find["Release"] = { '$in': this.timebox_oids };
            if(me.timeboxValue){
                start_date = new Date(me.timeboxValue.getRecord().get('ReleaseStartDate'));
                end_date = new Date(me.timeboxValue.getRecord().get('ReleaseDate'));
            }
        }else{
            start_date = Rally.technicalservices.Toolbox.getBeginningOfMonthAsDate(Rally.util.DateTime.add(new Date(), "month",cb.getValue()));
        }

        find["_ValidFrom"] = {$gt: start_date};
        //find["_ValidTo"] = {$lte: end_date};
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            itemId: 'crt',
            calculatorType: 'Rally.technicalservices.calculator.BlockedReason',
            calculatorConfig: {},
            storeConfig: {
                fetch: this.fetch,
                find: find,
                limit: 'Infinity',
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
                compress: true 
            },
            chartConfig: {
                    chart: {
                        type: 'pie'
                    },
                    title: {
                        text: this.chartTitle
                    },
                    plotOptions: {
                        pie: {
                        //     dataLabels: {
                        //         enabled: true,
                        //         format: '<b>{point.name}</b><br/>{point.percentage:.0f}%',
                        //         distance: 15,
                        //         overflow: "none",
                        //         crop: false
                        //     }
                        // }
                            dataLabels: {
                                enabled: true,
                                //format: '<b>{point.name.substr(0,10)}</b><br/>{point.percentage:.0f}%',
                                formatter: function(){
                                    if (this.point.name.length > 20){
                                        return '<b>'+ this.point.name.substr(0,20) + '...</b><br/>' + Math.round(this.point.percentage) +'%';
                                    }else{
                                        return '<b>'+ this.point.name + '</b><br/>' + Math.round(this.point.percentage) +'%';   
                                    }                        
                                },
                                distance: 15
                            }   
                        }                  
                    }
                }
            });
    }
});