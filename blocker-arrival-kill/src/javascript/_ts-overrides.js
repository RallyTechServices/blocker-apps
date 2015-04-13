/**
 * Created by kcorkan on 3/24/15.
 */
//(function () {
//    var Ext = window.Ext4 || window.Ext;
//
//    /**
//     * @class Rally.ui.chart.Chart
//     *
//     * A configurable chart component that can display different types of charts using Rally data inside your apps.
//     * The chart component is built using [Highcharts](http://www.highcharts.com/ref/). The example below shows how you
//     * would create a chart using Lookback API snapshot data and a custom calculator built by extending
//     * {@link Rally.data.lookback.calculator.BaseCalculator BaseCalculator}.
//     *
//     *       Ext.define('MyChartApp', {
//     *          extend: 'Rally.app.App',
//     *
//     *          items: [
//     *              {
//     *                  xtype: 'rallychart',
//     *
//     *                  storeType: 'Rally.data.lookback.SnapshotStore',
//     *                  storeConfig: {
//     *                      find: {
//     *                          _TypeHierarchy: 'HierarchicalRequirement',
//     *                          _ItemHierarchy: MY_PORTFOLIO_ITEM_OID,
//     *                          Children: null
//     *                      },
//     *                      fetch: ['ScheduleState', 'PlanEstimate'],
//     *                      hydrate: ['ScheduleState']
//     *                  },
//     *
//     *                  calculatorType: 'MyCalculator',
//     *
//     *                  chartConfig: {
//     *                      chart: {
//     *                          zoomType: 'xy'
//     *                      },
//     *                      title: {
//     *                          text: 'My Chart'
//     *                      },
//     *                      xAxis: {
//     *                          tickmarkPlacement: 'on',
//     *                          tickInterval: 20,
//     *                          title: {
//     *                              text: 'Days'
//     *                          }
//     *                      },
//     *                      yAxis: [
//     *                          {
//     *                              title: {
//     *                                  text: 'Count'
//     *                              }
//     *                          }
//     *                      ]
//     *                  }
//     *              }
//     *          ]
//     *      });
//     *
//     * For more information on visualizing Rally data see the [Data Visualization](#!/guide/data_visualization) guide.
//     *
//     * Additional chart examples can be found in the [Examples](#!/example) section.
//     */
//    Ext.define('Rally.ui.chart.Chart', {
//        extend: 'Ext.Container',
//        alias: 'widget.rallychart',
//
//        items: [
//            {
//                xtype: 'container',
//                itemId: 'header',
//                cls: 'header'
//            },
//            {
//                xtype: 'container',
//                itemId: 'chart',
//                cls: 'chart'
//            }
//        ],
//
//        clientMetrics: [
//            {
//                beginEvent: 'storesConfigured',
//                endEvent: 'storesLoaded',
//                description: 'rallychart - lookback query time'
//            },
//            {
//                beginEvent: 'storesValidated',
//                endEvent: 'snapshotsAggregated',
//                description: 'rallychart - lookback data aggregated by calculator'
//            },
//            {
//                beginEvent: 'readyToRender',
//                endEvent: 'chartRendered',
//                description: 'rallychart - highcharts rendered'
//            }
//        ],
//
//        config: {
//            /**
//             * @cfg {Function}
//             * Called before chart configuration and rendering occurs. Useful to setup any custom and dynamic data
//             * needed for rendering.
//             */
//            updateBeforeRender: undefined,
//
//            /** @cfg {Function}
//             * Called after highcharts has rendered. Useful for tying together page behavior in a multi chart app.
//             */
//            updateAfterRender: undefined,
//
//            /**
//             * @cfg {Object}
//             * The configuration for the specified store(s)
//             */
//            storeConfig: undefined,
//
//            /**
//             * @cfg {String}
//             * The store to create to load the data
//             */
//            storeType: 'Rally.data.lookback.SnapshotStore',
//
//            /**
//             * @cfg {String}
//             * The calculator to create to prepare the data.
//             * This should reference a class which implements a prepareChartData method.
//             */
//            calculatorType: undefined,
//
//            /**
//             * @cfg {Object}
//             * The configuration for the specified calculator
//             */
//            calculatorConfig: undefined,
//
//            /**
//             * @cfg {String[]}
//             * The set of chart colors you want to use, as hex values
//             */
//            chartColors: ['#E57E3A', '#E5D038', '#B2E3B6', '#3A874F'],
//
//            /**
//             * @cfg {Object}
//             * The Highcharts configuration
//             */
//            chartConfig: undefined,
//
//            /**
//             * @cfg {Object}
//             * The data to chart. If this configuration option is specified, no stores will be used or loaded.
//             * This object should contain a `series` field that specifies series objects in the Highcharts format and
//             * a `categories` field specifying the x-axis values.
//             * These are documented in the [Highcharts documentation](http://api.highcharts.com/highcharts).
//             */
//            chartData: undefined,
//
//            /**
//             * @cfg {String} queryErrorMessage
//             * Configure the error message that gets displayed when the store loads no data.
//             */
//            queryErrorMessage: 'No data was found based on the current chart settings.',
//
//            /**
//             * @cfg {String} aggregationErrorMessage
//             * Configure the error message the gets displayed when the calculator aggregation returns no data.
//             */
//            aggregationErrorMessage: "No data was returned by the calculator aggregation provided.",
//
//            /**
//             * @cfg {String} authorizationErrorMessage
//             * Configure the error message that gets displayed when an authorization error occurs.
//             */
//            authorizationErrorMessage: 'Your request requires access to a workspace or project for which you do not have permission. Contact your subscription administrator to request permission.',
//
//            /**
//             * @cfg {String} haltedWorkspaceErrorMessage
//             * Configure the error message that gets displayed when a workspace has been halted
//             */
//            haltedWorkspaceErrorMessage: 'You caught us working! The chart for this workspace is temporarily unavailable. Please check back shortly.',
//
//            /**
//             * @cfg {String} serviceUnavailableErrorMessage
//             * Configure the error message that gets displayed if the lookback API service is temporarily unavailable
//             */
//            serviceUnavailableErrorMessage: 'The Lookback API service is temporarily unavailable. Please check back shortly.',
//
//            /**
//             * @cfg {Boolean} loadMask
//             * False to disable a load mask from displaying while the view is loading.
//             */
//            loadMask: true
//        },
//
//        onRender: function () {
//            console.log('onRender');
//            if (this.loadMask) {
//                this.getEl().mask('Loading...');
//            }
//            this.callParent(arguments);
//        },
//
//        constructor: function (config) {
//            this.callParent(arguments);
//            this._loadExternalDependencies();
//        },
//
//        initComponent: function() {
//            this.addEvents(
//                /**
//                 * @event
//                 * Fires when the store(s) have been configured but before being loaded
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'storesConfigured',
//
//                /**
//                 * @event
//                 * Fires when the specified store(s) have been loaded
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'storesLoaded',
//
//                /**
//                 * @event
//                 * Fires when the chart data has been validated
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'storesValidated',
//
//                /**
//                 * @event
//                 * Fires when the chart data has been aggregated using the configured calculator
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'snapshotsAggregated',
//
//                /**
//                 * @event
//                 * Fires just before the chart is rendered
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'readyToRender',
//
//                /**
//                 * @event
//                 * Fires once the chart has been rendered
//                 * @param {Rally.ui.chart.Chart} this
//                 */
//                'chartRendered'
//            );
//
//            this.callParent(arguments);
//        },
//
//        /**
//         * Get the Ext/HighCharts wrapper object
//         * http://joekuan.org/demos/Highcharts_Sencha/docs/#!/api/Chart.ux.Highcharts
//         * @returns {Chart.ux.HighCharts}
//         */
//        getChartWrapper: function() {
//            return this.down('highchart');
//        },
//
//        /**
//         * Get the raw HighCharts chart object
//         * http://api.highcharts.com/highchart
//         * @returns {Highcharts.Chart}
//         */
//        getChart: function() {
//            console.log('getChart', this.getChartWrapper());
//            return this.getChartWrapper() && this.getChartWrapper().chart;
//        },
//
//        _loadExternalDependencies: function () {
//            if (Rally && Rally.sdk && Rally.sdk.dependencies && Rally.sdk.dependencies.Analytics) {
//                Rally.sdk.dependencies.Analytics.load(this._onAfterLoadDependencies, this);
//            } else {
//                // this._onAfterLoadDependencies must be called asynchronously in both rui and app sdk
//                // in order for client metrics event parenting to happen correctly
//                Ext.Function.defer(this._onAfterLoadDependencies, 1, this);
//            }
//        },
//
//        _onAfterLoadDependencies: function () {
//            console.log('_onAfterLoadDependencies');
//            if (!this._validateConfiguration()) {
//                return this._unmask();
//            }
//            console.log('_onAfterLoadDependencies validateConfiguration passed');
//
//            // Chart colors config array likes to be passed around by reference and bleed
//            // into other charts.
//            this.chartColors = Ext.Array.clone(this.chartColors);
//
//            var chartConfig = this.getChartConfig() || {};
//            this._setChartConfigDefaults(chartConfig);
//            console.log('_onAfterLoadDependencies after _setChartConfigDefaults');
//
//            this._callUpdateBeforeRender();
//            console.log('_onAfterLoadDependencies after _callUpdateBeforeRender');
//
//            this.fireEvent('storesConfigured', this);
//            console.log('_onAfterloadDependencies after storesConfigurated', this.chartData);
//            if(this.chartData) {
//                this._renderChart();
//            } else {
//                this._setUpCalculator();
//                this._loadStores();
//            }
//        },
//
//        _setChartConfigDefaults: function (chartConfig) {
//            chartConfig.credits = chartConfig.credits || {};
//            chartConfig.credits.enabled = false;
//            if(!chartConfig.exporting) {
//                chartConfig.exporting = {
//                    enabled: false
//                };
//            }
//        },
//
//        _callUpdateBeforeRender: function () {
//            if (typeof this.updateBeforeRender === 'function') {
//                this.updateBeforeRender.apply(this);
//            }
//        },
//
//        _setUpCalculator: function () {
//            this.calculator = Ext.create(this.getCalculatorType(), this.getCalculatorConfig());
//        },
//
//        _validateConfiguration: function () {
//            var requiredConfigs = ['storeConfig', 'storeType', 'calculatorType', 'calculatorConfig', 'chartConfig'];
//            if(this.chartData) {
//                // If chart data is provided, you do not need the store/calculator information
//                return true;
//            }
//            for (var i = 0; i < requiredConfigs.length; i++) {
//                var configField = requiredConfigs[i];
//                if (!this[configField]) {
//                    return this._setErrorMessage("Missing required configuration field: " + configField);
//                }
//            }
//            return true;
//        },
//
//        /**
//         * Loop over the given store configs and load them. Because we have the ability to
//         * handle multiple stores we need to load each one and check if all of them have
//         * been loaded as each one finishes pulling data.
//         * @private
//         */
//        _loadStores: function () {
//            this._wrapStores();
//
//            this.loadedStores = [];
//            this.queryValid = true;
//            this.workspaceHalted = false;
//            this.serviceUnavailable = false;
//
//            for (var i = 0; i < this.storeConfig.length; i++) {
//                this._loadStore(this.storeConfig[i], i);
//            }
//        },
//
//        _loadStore: function (storeConfig, storeRank) {
//            var self = this;
//
//            Ext.merge(storeConfig, {
//                exceptionHandler: function (proxy, response, operation) {
//                    if (response.status !== 200) {
//                        self.queryValid = false;
//                    }
//
//                    if (response.status === 409) {
//                        self.workspaceHalted = true;
//                    } else if (response.status === 503) {
//                        self.serviceUnavailable = true;
//                    }
//                }
//            });
//
//            storeConfig.limit = storeConfig.limit || Infinity;
//
//            var store = Ext.create(this.storeType, storeConfig);
//            store.rank = storeRank;
//
//            store.on('load', this._storeLoadHandler, this);
//            store.load();
//        },
//
//        _storeLoadHandler: function (store) {
//            this.loadedStores.push(store);
//            if (this.loadedStores.length === this.storeConfig.length) {
//                this._onStoresLoaded();
//            }
//        },
//
//        _setErrorMessage: function (message) {
//            this.down('#chart').add({
//                xtype: 'displayfield',
//                itemId: 'error',
//                value: message
//            });
//            this._setChartReady();
//            return false;
//        },
//
//        _setChartReady: function () {
//            this.componentReady = true;
//            this._callUpdateAfterRender();
//        },
//
//        _callUpdateAfterRender: function () {
//            if ('function' === typeof this.updateAfterRender) {
//                this.updateAfterRender.apply(this);
//            }
//        },
//
//        _onStoresLoaded: function () {
//            this.fireEvent('storesLoaded', this);
//            this._unmask();
//
//            if (this.serviceUnavailable) {
//                return this._setErrorMessage(this.serviceUnavailableErrorMessage);
//            }
//            if (this.workspaceHalted) {
//                return this._setErrorMessage(this.haltedWorkspaceErrorMessage);
//            }
//            if (!this.queryValid) {
//                return this._setErrorMessage(this.authorizationErrorMessage);
//            }
//            if (this._noDataLoaded()) {
//                return this._setErrorMessage(this.queryErrorMessage);
//            }
//
//            Ext.Array.sort(this.loadedStores, function (left, right) {
//                return left.rank - right.rank;
//            });
//
//            this._unWrapStores();
//
//            this.fireEvent('storesValidated', this);
//            this.chartData = this.calculator.prepareChartData(this.loadedStores);
//            this.fireEvent('snapshotsAggregated', this);
//
//            this.fireEvent('readyToRender', this);
//            this._validateAggregation();
//            this.fireEvent('chartRendered', this);
//        },
//
//        _wrapStores: function () {
//            if (!Ext.isArray(this.storeConfig)) {
//                this.storeConfig = [this.storeConfig];
//            }
//        },
//
//        _unWrapStores: function () {
//            if (this.loadedStores.length === 1) {
//                this.loadedStores = this.loadedStores[0];
//            }
//        },
//
//        _noDataLoaded: function () {
//            for (var i = 0; i < this.loadedStores.length; i++) {
//                var store = this.loadedStores[i];
//                if (store.getCount() > 0) {
//                    return false;
//                }
//            }
//            return true;
//        },
//
//        _unmask: function () {
//            if (this.loadMask && this.getEl()) {
//                this.getEl().unmask();
//            }
//        },
//
//        _validateAggregation: function () {
//            if (!this._haveDataToRender()) {
//                return this._setErrorMessage(this.aggregationErrorMessage);
//            }
//
//            this._renderChart();
//        },
//
//        _isData: function(point) {
//            return point > 0;
//        },
//
//        _haveDataToRender: function () {
//            var seriesData = this.chartData.series;
//
//            for (var i = 0, ilength = seriesData.length; i < ilength; i++) {
//                var data = seriesData[i].data;
//
//                for (var j = 0, jlength = data.length; j < jlength; j++) {
//                    if (this._isData(data[j])) {
//                        return true;
//                    } else if(Ext.isArray(data[j]) && _.some(data[j], this._isData)) {
//                        return true;
//                    }
//                }
//            }
//        },
//
//        _renderChart: function () {
//            this._unmask();
//
//            var chartConfig = this.getChartConfig(),
//                chartEl = this.down('#chart');
//            console.log('renderchart chartEl', chartEl);
//            if (chartEl) {
//                chartConfig.xAxis = chartConfig.xAxis || {};
//                chartConfig.xAxis.categories = this.chartData.categories;
//
//                this._setChartColorsOnSeries(this.chartData.series);
//
//                var highChartConfig = {
//                    xtype: 'highchart',
//                    chartConfig: chartConfig,
//                    series: this.chartData.series,
//                    initAnimAfterLoad: false
//                };
//
//                chartEl.add(highChartConfig);
//                this._setChartReady();
//            }
//        },
//
//        _setChartColorsOnSeries: function (series) {
//            var colors = this.chartColors,
//                length = Math.min(series.length, colors.length);
//
//            for (var i = 0; i < length; i += 1) {
//                series[i].color = colors[i];
//            }
//        }
//    });
//}());

Ext.override(Ext.data.proxy.Server, {
    timeout : 180000,
    processResponse: function(success, operation, request, response, callback, scope) {
        var me = this,
            reader,
            result;

        if (success === true) {
            reader = me.getReader();
            reader.applyDefaults = operation.action === 'read';
            result = reader.read(me.extractResponseData(response));

            if (result.success !== false) {

                Ext.apply(operation, {
                    response: response,
                    resultSet: result
                });

                operation.commitRecords(result.records);
                operation.setCompleted();
                operation.setSuccessful();
            } else {
                operation.setException(result.message);
                me.fireEvent('exception', this, response, operation);
            }
        } else {
            if (response) {
                me.setException(operation, response);
            }
            me.fireEvent('exception', this, response, operation);
        }


        if (typeof callback == 'function') {
            callback.call(scope || me, operation);
        }

        me.afterRequest(request, success);
    },


    setException: function(operation, response) {
        operation.setException({
            status: response.status ,
            statusText: response.statusText
        });
    },


    extractResponseData: Ext.identityFn,


    applyEncoding: function(value) {
        return Ext.encode(value);
    },
});
