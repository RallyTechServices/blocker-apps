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
        var me = this;

        var store = Ext.create('Ext.data.Store',{
            fields: ['name','value'],
            data: this.pickerOptions
        });
        
        this.down('#selection_box').add(
        {
            xtype      : 'radiogroup',
            fieldLabel : 'Select data for ',
            defaults: {
                flex: 1
            },
            layout: 'hbox',
            items: [
                {
                    boxLabel  : 'Time Period',
                    name      : 'timebox',
                    inputValue: 'T',
                    id        : 'radio1',
                    checked   : true,
                    margin: '0 0 0 10'
                }, {
                    boxLabel  : 'Iteration',
                    name      : 'timebox',
                    inputValue: 'I',
                    id        : 'radio2',
                    margin: '0 0 0 10'
                }, {
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
            text: 'Data...',
            itemId: 'btn-data',
            margin: '0 0 0 10',
            scope: this, 
            handler: this._viewData,
            //disabled: true
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
                },
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
                },
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
    _maskWindow: function(mask){
        this.down('#btn-data').setDisabled(mask);
        this.setLoading(mask);
    },
    _buildChart: function(cb){
        var me = this;

        this.logger.log('CB value>>>',cb);

        var start_date , end_date = new Date();
        
        var project = this.getContext().getProject().ObjectID; 

        var find = {
                $or: [
                      {"BlockedReason": {$exists: true}},
                      {"_PreviousValues.BlockedReason": {$exists: true}},
                      {"Blocked": true},
                      {"_PreviousValues.Blocked": true}
                ],
                "_TypeHierarchy": {$in: me.types},
                "_ProjectHierarchy": {$in: [project]}
        }

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

        this.logger.log('_buildChart', start_date, project);

        this.down('#display_box').removeAll(); 
        
        var chart = this.down('#display_box').add({
            xtype: 'rallychart',
            itemId: 'crt',
            loadMask: false,
            listeners: {
                readyToRender: function(chart){
                    me.logger.log('readyToRender',chart);
                },
                chartRendered: function(chart){
                    me.logger.log('chartRendered');
                }
            },
            chartColors:['#c42525','#8bbc21'],
            storeConfig: {
                hydrate: this.hydrate,
                fetch: this.fetch,
                compress: true, 
                limit: 'Infinity',
                find: find,
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
                    yAxis: [{
                        min: 0,
                        minTickInterval: 1,
                        title: {
                            text: 'Blockers'
                        },
                        labels: {
                            format: '{value:.0f}'
                        }
                    }]
             }
        });
    }
});