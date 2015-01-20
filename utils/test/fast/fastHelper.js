var useObjectID = function(value,record) {
    if ( record.get('ObjectID') ) {
        return record.get('ObjectID');
    } 
    return 0;
};

var shiftDayBeginningToEnd = function(day) {
    return Rally.util.DateTime.add(Rally.util.DateTime.add(Rally.util.DateTime.add(day,'hour',23), 'minute',59),'second',59);
};

var snapshots = [
    Ext.create('mockSnapshot', {
        ObjectID: 1, 
        FormattedID: 'US1',
        Name: 'Name of US1',
        Blocked: true,
        BlockedReason: 'br',
        _ValidFrom: '',
       }),
   
   ];

Ext.define('mockSnapshot',{
    ObjectID: 0, 
    FormattedID: null,
    Name: null,
    Blocked: false,
    BlockedReason: null,
    _PreviousValues: null,
    _ValidFrom: null,
    id: function(){return this.ObjectID}
});
