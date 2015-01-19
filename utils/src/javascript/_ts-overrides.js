Ext.override(Rally.ui.chart.Chart,{
    _loadStore: function (storeConfig, storeRank) {

        var self = this;

        Ext.merge(storeConfig, {
            exceptionHandler: function (proxy, response, operation) {
                console.log(proxy,response,operation);
                if (response.status !== 200) {
                    self.queryValid = false;
                }
                if (response.status === 409) {
                    self.workspaceHalted = true;
                } else if (response.status === 503) {
                    self.serviceUnavailable = true;
                }
            }
        });

        storeConfig.limit = storeConfig.limit || Infinity;

        var store = Ext.create(this.storeType, storeConfig);
        store.rank = storeRank;

        store.on('load', this._storeLoadHandler, this);
        store.load({params: { removeUnauthorizedSnapshots: true } });
    }
});
