Ext.define('Rally.technicalservices.FileUtilities', {
    singleton: true,
    logger: new Rally.technicalservices.Logger(),
    saveCSVToFile:function(csv,file_name,type_object){
        if (type_object == undefined){
            type_object = {type:'text/csv;charset=utf-8'};
        }
        var blob = new Blob([csv],type_object);
        saveAs(blob,file_name);
    },

    saveTextAsFile: function(textToWrite, fileName, options)
    {
        var options = Ext.merge( { type:'text/plain' }, options);
        console.log(options);
        var textFileAsBlob = new Blob([textToWrite], options);
        var fileNameToSaveAs = fileName;

        var downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null)
        {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        }
        else
        {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = this.destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }
        downloadLink.click();
    },
    destroyClickedElement: function(event)
    {
        document.body.removeChild(event.target);
    },
    convertDataArrayToCSVText: function(data_array, requestedFieldHash){

        var text = '';
        Ext.each(Object.keys(requestedFieldHash), function(key){
            text += requestedFieldHash[key] + ',';
        });
        text = text.replace(/,$/,'\n');

        Ext.each(data_array, function(d){
            Ext.each(Object.keys(requestedFieldHash), function(key){
                if (d[key]){
                    if (typeof d[key] === 'object'){
                        if (d[key].FormattedID) {
                            text += Ext.String.format("\"{0}\",",d[key].FormattedID );
                        } else if (d[key].Name) {
                            text += Ext.String.format("\"{0}\",",d[key].Name );
                        } else if (!isNaN(Date.parse(d[key]))){
                            text += Ext.String.format("\"{0}\",",Rally.util.DateTime.formatWithDefaultDateTime(d[key]));
                        }else {
                            text += Ext.String.format("\"{0}\",",d[key].toString());
                        }
                    } else {
                        text += Ext.String.format("\"{0}\",",d[key] );
                    }
                } else {
                    text += ',';
                }
            },this);
            text = text.replace(/,$/,'\n');
        },this);
        return text;
    },
    /*
     * will render using your grid renderer.  If you want it to ignore the grid renderer,
     * have the column set _csvIgnoreRender: true
     */
    getCSVFromGrid:function(grid){
        var deferred = Ext.create('Deft.Deferred');
        var store = grid.getStore();

        var columns = grid.columns;
        var column_names = [];
        var headers = [];

        var csv = [];

        Ext.Array.each(columns,function(column){
            if ( column.dataIndex || column.renderer ) {
                column_names.push(column.dataIndex);
                if ( column.csvText ) {
                    headers.push(column.csvText);
                } else {
                    headers.push(column.text);
                }
            }
        });

        csv.push('"' + headers.join('","') + '"');

        var mock_meta_data = {
            align: "right",
            classes: [],
            cellIndex: 9,
            column: null,
            columnIndex: 9,
            innerCls: undefined,
            recordIndex: 5,
            rowIndex: 5,
            style: "",
            tdAttr: "",
            tdCls: "x-grid-cell x-grid-td x-grid-cell-headerId-gridcolumn-1029 x-grid-cell-last x-unselectable",
            unselectableAttr: "unselectable='on'"
        }

        for ( var i=0; i<store.getCount(); i++ ) {
            var record = store.getAt(i);

            var node_values = [];
            Ext.Array.each(columns,function(column){
                if ( column.dataIndex) {
                    var column_name = column.dataIndex;
                    var display_value = record.get(column_name);

                    if ( !column._csvIgnoreRender && column.renderer ) {
                        display_value = column.renderer(display_value,mock_meta_data,record, 0, 0, store, grid.getView());
                    }
                    node_values.push(display_value);
                } else {
                    var display_value = null;
                    if ( !column._csvIgnoreRender && column.renderer ) {
                        display_value = column.renderer(display_value,mock_meta_data,record,record, 0, 0, store, grid.getView());
                        node_values.push(display_value);
                    }
                }
            },this);
            csv.push('"' + node_values.join('","') + '"');
        }
        return  csv.join('\r\n');
    }
});
