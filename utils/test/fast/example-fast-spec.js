describe("Rally.technicalservices.Toolbox Test Set", function() {
    it("when given a date, it should be able to return the very first day of the month",function(){
        expect(Rally.technicalservices.Toolbox.getBeginningOfMonthAsDate(Rally.util.DateTime.fromIsoString('2014-01-01T06:00:30Z'))
        ).toEqual(Rally.util.DateTime.fromIsoString('2013-12-01T00:00:00-07:00'));
    });
    it("when given a date, it should be able to return the very last moment of the month",function(){
        expect(Rally.technicalservices.Toolbox.getEndOfMonthAsDate(Rally.util.DateTime.fromIsoString('2014-01-01T06:00:30Z'))
        ).toEqual(Rally.util.DateTime.fromIsoString('2013-12-01T00:00:00-07:00'));
    });    
});

describe("Rally.technicalservices.calculator.StateTouchCalculator Test Set", function() {
    it("when given a date, it should be able to return the very first day of the month",function(){
        expect(Rally.technicalservices.Toolbox.getBeginningOfMonthAsDate(Rally.util.DateTime.fromIsoString('2014-01-01T06:00:30Z'))
        ).toEqual(Rally.util.DateTime.fromIsoString('2013-12-01T00:00:00-07:00'));
    });
    it("when given a date, it should be able to return the very last moment of the month",function(){
        expect(Rally.technicalservices.Toolbox.getEndOfMonthAsDate(Rally.util.DateTime.fromIsoString('2014-01-01T06:00:30Z'))
        ).toEqual(Rally.util.DateTime.fromIsoString('2013-12-01T00:00:00-07:00'));
    });    
});