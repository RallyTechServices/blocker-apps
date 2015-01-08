Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    items: [
        {xtype:'container',itemId:'display_box'},
        {xtype:'tsinfolink'}
    ],
    chartTitle: 'Blocker Causes',
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
        
        var counts = Rally.technicalservices.BlockedToolbox.getCountsByReason(artifacts);
        
        var series_data = []; 
        Ext.Object.each(counts, function(key,val){
            series_data.push([key,val]);
        },this);
        var series = [{type: 'pie', name: this.chartTitle, data: series_data}];
        
        this.logger.log('_buildCharts', artifacts, series);
        
        this.down('#display_box').add({
            xtype: 'rallychart',
            chartData: {
                series: series,
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
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b><br/>{point.percentage:.0f}%'
                            }
                        }
                    }
                }
            });
    }
});