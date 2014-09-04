'use strict';

describe('Service: OSSApi', function () {

  // load the service's module
  beforeEach(module('ossClientUiApp'));

  // instantiate service
  var OSSApi;
  beforeEach(inject(function (_OSSApi_) {
    OSSApi = _OSSApi_;
  }));

  it('should do something', function () {
    expect(!!OSSApi).toBe(true);
  });

});
