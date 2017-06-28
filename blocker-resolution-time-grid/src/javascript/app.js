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
            stateful: true,
            stateId: this.getContext().getScopedStateId('resolution-time-radio'),
            stateEvents: ['change'],
            items: [
                {
                    boxLabel  : 'Time Period',
                    name      : 'timebox',
                    inputValue: 'T',
                    id        : 'radio1',
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
                    rb.saveState();
                    me.logger.log('radiobox change', rb.lastValue, rb.getValue());
                    me.down('#time_box').removeAll();
                    console.log('lastValue', rb.lastValue.timebox);
                    if(rb.lastValue.timebox == 'T'){
                         var cb = me.down('#time_box').add({
                                xtype: 'rallycombobox',
                                store: store,
                                queryMode: 'local',
                                fieldLabel: 'Show data from',
                                displayField: 'name',
                                valueField: 'value',
                                minWidth: 300,
                                //value: -3,
                                name:'TimePeriod',
                                stateful: true,
                                stateId: me.getContext().getScopedStateId('blocker-resolution-timeperiod'),
                                //stateEvents: ['select'],
                                listeners: {
                                    scope: me,
                                    select: me._fetchData,
                                    ready:me._fetchData
                                }
                            });
                        me._fetchData(cb);

                    }else if(rb.lastValue.timebox == 'I'){
                            //console.log('me>>',me);

                            me.down('#time_box').add({
                                xtype: 'rallyiterationcombobox',
                                fieldLabel: 'Iteration: ',
                                minWidth: 300,
                                stateful: true,
                                stateId: me.getContext().getScopedStateId('blocker-resolution-iteration'),
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

                            me.down('#time_box').add({
                                xtype: 'rallyreleasecombobox',
                                fieldLabel: 'Release: ',
                                minWidth: 300,
                                stateful: true,
                                stateId: me.getContext().getScopedStateId('blocker-resolution-release'),
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


        // var cb = this.down('#time_box').add({
        //     xtype: 'combobox',
        //     store: store,
        //     queryMode: 'local',
        //     fieldLabel: 'Show data from',
        //     displayField: 'name',
        //     valueField: 'value',
        //     value: -3,
        //     minWidth: 300,
        //     listeners: {
        //         scope: this,
        //         select: this._fetchData
        //     }
        // });
        this.down('#selection_box').add({
            xtype: 'rallybutton',
            itemId: 'btn-export',
            iconCls: 'icon-export',
            cls: 'rly-small secondary',
            margin: '0 0 0 10',
            scope: this,
            handler: this._exportData
        });
        this._fetchData(cb);
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
                me._fetchData(cb);
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

    _fetchData: function(cb){
        var me = this;
        this.logger.log('_fetchData', cb);
        var start_date , end_date = new Date();

        //var start_date = Rally.util.DateTime.toIsoString(Rally.util.DateTime.add(new Date(),"month",cb.getValue()));
        var project = this.getContext().getProject().ObjectID;

        var find = {
               $or: [
                     {"BlockedReason": {$exists: true}},
                     {"_PreviousValues.BlockedReason": {$exists: true}},
                     {"Blocked": true},
                     {"_PreviousValues.Blocked": true}
               ],
               "_TypeHierarchy": {$in: this.types},
               "_ProjectHierarchy": {$in: [project]}
            };

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


        // this.logger.log('_fetchData',project,start_date);
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
            find: find,
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
        var reason_data = {},
            thisProject = this.getContext().getProject().Name;

        this.logger.log('_processData',snaps_by_oid, blocked_durations);
        Ext.each(blocked_durations, function(duration){
            duration.Project = thisProject;
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
            data.push({
                reason: key,
                mean: Math.round(Ext.Array.mean(val)),
                min: Math.round(Ext.Array.min(val)),
                max: Math.round(Ext.Array.max(val)),
                total: val.length,
                totalDuration: Math.round(Ext.Array.sum(val))
            });
        });

        if (data.length > 0){
            var all = _.flatten(_.values(processed_data));
            data.push({
                reason: 'All',
                mean: Math.round(Ext.Array.mean(all)),
                min: Math.round(Ext.Array.min(all)),
                max: Math.round(Ext.Array.max(all)),
                total: total,
                totalDuration: Math.round(Ext.Array.sum(all))
            });
        }

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

       if (data.length > 0){
           var store = Ext.create('Rally.data.custom.Store',{
               data: data,
               pageSize: data.length
           });

           this.down('#display_box').add({
               xtype: 'rallygrid',
               store: store,
               columnCfgs: this.getColumnCfgs(),
               showPagingToolbar: false,
               pageSize: data.length,
               showRowActionsColumn: false
           });
       } else {
            this.down('#display_box').add({
                xtype: 'container',
                html: '<div class="no-data-container"><div class="secondary-message">No blockers found for the selected scope and time period.</div></div>'
            });
       }
   },
    getColumnCfgs: function(){
        return [{
            dataIndex: 'reason',
            text: 'Reason',
            flex: 1
        },{
            dataIndex: 'mean',
            text: 'Mean'
        },{
            dataIndex: 'min',
            text: 'Min'
        },{
            dataIndex: 'max',
            text: 'Max'
        },{
            dataIndex: 'total',
            text: 'Total Blockers per Reason'
        },{
            dataIndex: 'totalDuration',
            text: 'Total Days Blocked'
        }]
    }
});
