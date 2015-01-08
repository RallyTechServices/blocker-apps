Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'message_box',tpl:'Hello, <tpl>{_refObjectName}</tpl>'},
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    
    chartTitle: 'Historical Blocker Status',

    launch: function() {
        Ext.create('Rally.technicalservices.BlockedArtifact.Store',{
            listeners: {
                scope: this,
                artifactsloaded: function(blockedArtifacts,success){
                    this.logger.log('artifactsLoaded', blockedArtifacts, success);
                    this._buildChart(blockedArtifacts);
                }
            }
        });
    },

    _buildChart: function(artifacts){
        this.logger.log('_buildChart artifacts', artifacts);
        
        var dateFormat = "F";
        var dateInterval = "month";
        
        var categories = Rally.technicalservices.BlockedToolbox.getDateBucketsForArtifacts(artifacts, ["blockedDate","unblockedDate"], dateInterval, dateFormat);
        
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