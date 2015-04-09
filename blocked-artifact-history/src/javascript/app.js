Ext.define('blocked-artifact-history', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype: 'container', itemId: 'header_box', layout: {type:'hbox'}, items: [
            {xtype:'container',itemId:'control_box',layout:{type:'hbox'}},
            {xtype:'container',itemId:'button_box',layout:{type:'hbox'}},
            {xtype:'container',itemId:'summary_box', padding: 10, tpl:'<tpl><font color="grey"><b><i>{message}</i></b></color></tpl>'},

        ]},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    invalidDateString: 'Invalid Date',
    dateFormat: 'MM/dd/YYYY',
    showOptionsStore: [[true, "Current Blocked Items"],[false, "Items Blocked on or after"]],
    lookbackFetchFields: ['ObjectID','_PreviousValues.Blocked','_SnapshotNumber','Name','FormattedID','_ProjectHierarchy','Feature','_TypeHierarchy','Blocked','_ValidFrom','_ValidTo','BlockedReason','c_BlockerOwnerFirstLast','c_BlockerCategory','c_BlockerCreationDate','DirectChildrenCount','Feature','Iteration','ScheduleState'],
    featureHash: {},
    launch: function() {
        var defaultDate = Rally.util.DateTime.add(new Date(),"month",-3);
        this.down('#control_box').add({
            xtype: 'rallycheckboxfield',
            itemId: 'chk-blocked',
            fieldLabel: 'Blocked Only',
            labelAlign: 'right',
            labelWidth: 100,
            margin: 10,
            listeners: {
                scope: this,
                change: function() {this._filterBlocked();}
            }
        });

        this.down('#control_box').add({
            xtype: 'rallydatefield',
            itemId: 'from-date-picker',
            fieldLabel: 'Items blocked on or after',
            labelAlign: 'right',
            labelWidth: 150,
            value: defaultDate,
            margin: 10,
        });

        this.down('#button_box').add({
            xtype: 'rallybutton',
            itemId: 'run-button',
            text: 'Run',
            margin: 10,
            scope:this,
            width: 75,
            handler: this._run,
        });

        this.down('#button_box').add({
            xtype: 'rallybutton',
            itemId: 'export-button',
            text: 'Export',
            margin: 10,
            scope: this,
            width: 75,
            handler: this._exportData,
        });
    },
    _getFromDateControl: function(){
        return this.down('#from-date-picker');
    },
    _getFromDate: function(){
        if (this._getFromDateControl()){
            var fromDate = this._getFromDateControl().getValue();
            if (!isNaN(Date.parse(fromDate))){
                return fromDate;
            }
        }
        return null;
    },
    _filterBlocked: function(store){
        var filterBlocked = this._showOnlyBlockedItems();

        if (store == undefined){
            var grid = this._getGrid();
            if (grid == null){return;}
            store = grid.getStore();
        }

        if (filterBlocked === true){
            store.filterBy(function(item){
                return (item.get('Blocked') === true);
            });
        } else {
            store.clearFilter();
        }
        this._updateSummary(store.count());
    },
    _updateSummary: function(totalResults){
        var blocked = '';
        if (this._showOnlyBlockedItems()){
            blocked = "blocked"
        }
        var msg = Ext.String.format("{0} {1} items found.",totalResults, blocked);
        this.down('#summary_box').update({message: msg});
    },
    _showOnlyBlockedItems: function(){
        if (this.down('#chk-blocked')){
            this.logger.log('showOnlyBlockedItems ', this.down('#chk-blocked').getValue());
            return this.down('#chk-blocked').getValue();
        }
        return false;
    },
    _run: function(){
        var fromDate = this._getFromDate();
        if (isNaN(Date.parse(fromDate))){
            Rally.ui.notify.Notifier.showWarning({message: "No date selected.  Please select a date and try again."});
            return;
        }
        var current_project_id  = this.getContext().getProject().ObjectID;

        this.setLoading(true);
        this._fetchLookbackStore(current_project_id, fromDate).then({
            scope: this,
            success: this._calculateAgingForBlockers
        });
    },
    _fetchLookbackStore: function(currentProjectId, fromDate){
        var deferred = Ext.create('Deft.Deferred');

        var find = {};
        var isoFromDate = Rally.util.DateTime.toIsoString(fromDate);
        find["_ValidTo"] = {$gte: isoFromDate};
        find["$or"] = [{"_PreviousValues.Blocked":true},{"Blocked": true}];
        find["_TypeHierarchy"] = 'HierarchicalRequirement';
        find["_ProjectHierarchy"] = currentProjectId;

        Ext.create('Rally.data.lookback.SnapshotStore', {
            scope: this,
            listeners: {
                scope: this,
                load: function(store, data, success){
                    this.logger.log('fetchLookbackStore load',data.length, success);
                    var snaps_by_oid = Rally.technicalservices.Toolbox.aggregateSnapsByOidForModel(data);
                    deferred.resolve(snaps_by_oid);
                }
            },
            autoLoad: true,
            fetch: this.lookbackFetchFields,
            hydrate: ["Iteration","Project","ScheduleState"],
            find: find,
            sort: {'_ValidFrom': 1}
        });
        return deferred.promise;
    },
    _fetchFeatureHash: function(){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        me.logger.log('_fetchFeatureHash start');
        Ext.create('Rally.data.lookback.SnapshotStore', {
            scope: this,
            listeners: {
                scope: this,
                load: function(store, data, success){
                    me.logger.log('_fetchFeatureHash returned data',data);
                    Ext.each(data, function(d){
                        var key = d.get('ObjectID').toString();
                        this.featureHash[key] = d.getData();
                    }, this);
                    deferred.resolve(data);
                }
            },
            autoLoad: true,
            fetch: ['Name', 'FormattedID', 'ObjectID'],
            find: {
                "_TypeHierarchy": "PortfolioItem/Feature",
                "__At": "current"
            }
        });
        return deferred.promise;
    },
    _renderGrid: function(data){
        var columns = [
            {
               // xtype: 'templatecolumn',
                text: 'FormattedID',
                dataIndex: 'FormattedID',
                renderer: function(v,m,r){
                    var link_text = r.get('FormattedID');
                    if (v){
                        return Ext.String.format('<a href="{0}" target="_blank">{1}</a>',Rally.nav.Manager.getDetailUrl('/userstory/' +  r.get('ObjectID')),link_text);
                    }
                }
            },
            {text: 'Name', dataIndex: 'Name', flex: 1},
            {text: 'Project', flex: 1, dataIndex: 'Project', renderer: this._objectNameRenderer},
            //    {text: 'Feature', dataIndex: 'Feature', renderer: this._featureOidRenderer},
            {text: 'Total Blocked Time (Days)', dataIndex: 'totalBlocked', renderer: this._decimalRenderer}];
        columns.push({text: 'Average Resolution Time (Days)', dataIndex: 'averageResolutionTime', renderer: this._decimalRenderer});
        columns.push({text: '#Durations', dataIndex: 'numDurations'});
        columns.push({text: 'Iteration Blocked In', dataIndex: 'startValue', renderer: this._iterationRenderer});
        columns.push({text: 'Current Iteration', dataIndex: 'currentValue', renderer: this._iterationRenderer});
        columns.push({text: 'Current Schedule State', dataIndex: 'ScheduleState'});
        columns.push({text: 'Currently Blocked', dataIndex: 'Blocked', renderer: this._yesNoRenderer});
        if (this.down('#data-grid')){
            this.down('#data-grid').destroy();
        }

        var pageSize = data.length;
        var grid = Ext.create('Rally.ui.grid.Grid', {
            itemId: 'data-grid',
            store: Ext.create('Rally.data.custom.Store', {
                data: data,
                autoLoad: true,
                remoteSort: false,
                remoteFilter: false,
                pageSize: pageSize,
                scroll: 'vertical',
                listeners: {
                    scope: this,
                    load: function(store){
                        this._filterBlocked(store);
                    }
                }
            }),
            showPagingToolbar: false,
            columnCfgs: columns

        });
        this.down('#display_box').add(grid);

        this.setLoading(false);

    },
    _getGrid: function(){
        return this.down('#data-grid');
    },
    _decimalRenderer: function(v,m,r){
        if (!isNaN(v)){
            return v.toFixed(1);
        }
        return v;
    },
    _yesNoRenderer: function(v,m,r){
        if (v === true){
            return 'Yes';
        }
        return 'No';
    },
    _featureOidRenderer: function(v,m,r){
        if (v && typeof v == 'object'){
            return Ext.String.format('{0}: {1}', v.FormattedID, v.Name);
        }
        return v;
    },
    _objectNameRenderer: function(v,m,r){
        if (v && typeof v == 'object'){
            return v.Name;
        }
        return v;
    },
    _iterationRenderer: function(v,m,r){
        if (v && typeof v == 'object'){
            return v.Name;
        }
        return 'Unscheduled';
    },

    _calculateAgingForBlockers: function(snapsByOid){
        this.logger.log('_calculateAgingForBlockers',snapsByOid);
        var desiredFields = ['ObjectID','FormattedID','Name','Feature','Project','BlockedReason','Blocked','ScheduleState'];
        var data = [];
        var fromDate = this._getFromDate() || null;

        Ext.Object.each(snapsByOid, function(oid, snaps){
            var fieldObj = AgingCalculator.getFieldHash(snaps, desiredFields);
            var agingObj = AgingCalculator.calculateDurations(snaps,"Blocked",true,fromDate);
            var mobilityObj = AgingCalculator.calculateMobility(snaps,"_PreviousValues.Blocked","Blocked",true,"Iteration");
            var record = _.extend(fieldObj, mobilityObj);

            this.logger.log(fieldObj,agingObj,mobilityObj);

            record["numDurations"] = agingObj.durations.length;
            if (agingObj.durations.length > 0){
                record["totalBlocked"] = Ext.Array.sum(agingObj.durations);
                var mean_array = agingObj.durations;
                record["averageResolutionTime"] = Ext.Array.mean(agingObj.durations);
                data.push(record);
            }
        },this);
        this.logger.log('_calculateAgingForBlockers',data);

        this._renderGrid(data);
    },
    _exportData: function(){
        var filename = Ext.String.format('blockers-{0}.csv',Rally.util.DateTime.format(new Date(),'Y-m-d'));
        var csv = Rally.technicalservices.FileUtilities.getCSVFromGrid(this._getGrid());
        this.logger.log('_exportData', filename, csv);
        Rally.technicalservices.FileUtilities.saveCSVToFile(csv,filename);
    }
});