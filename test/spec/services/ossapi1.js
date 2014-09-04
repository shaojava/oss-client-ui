'use strict';

describe('Service: OSSApi1', function () {

  // load the service's module
  beforeEach(module('ossClientUiApp'));

  // instantiate service
  var OSSApi1;
  beforeEach(inject(function (_OSSApi1_) {
    OSSApi1 = _OSSApi1_;
  }));

  it('should do something', function () {
    expect(!!OSSApi1).toBe(true);
  });

});
