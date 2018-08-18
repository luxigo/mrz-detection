'use strict';

module.exports = function(options){
  return {
    getMrz: require('./getMrz'),
    readMrz: require('./readMrz')(options),
    getRoiStats: require('./getRoiStats')
  }
};
