var parser = {};
var config = {
  '$user variable': 'p_USER_ID'
};

var models = {
  Campaign: {
      name: {type: "string"},
      creator: {type: "User"}
  },

  User: {
    name: {type: "string"},
    email: {type: "string"},
    managers: {type: 'Collec User'}
  }
};

var tables = {
  Campaign: {
    id: 'id',
    name: 'name',
    creator_user_id: '',
    owner_user_id: ''
  },

  User: {
    id: '',
    name: '',
    email: ''
  },

  User_Manager: {
    user_id: {type: 'interger'},
    user_manager_id: {type: 'interger'}
  }
};

var TYPES = {
    'undefined'        : 'undefined',
    'number'           : 'number',
    'boolean'          : 'boolean',
    'string'           : 'string',
    '[object Function]': 'function',
    '[object RegExp]'  : 'regexp',
    '[object Array]'   : 'array',
    '[object Date]'    : 'date',
    '[object Error]'   : 'error'
  },
  TOSTRING = Object.prototype.toString;

function type(o) {
  return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? 'object' : 'null');
};


parser.IS = function (res1, res2) {
  var  resultType1 = getType(res1)
    , resultType2 = getType(res2)
    , type1 = resultType1.type
    , objResource1 = resultType1.resource
    , objCollection1 = resultType1.collection
    , type2 = resultType2.type
    , objResource2 = resultType2.resource
    , objCollection2 = resultType2.collection;

  if(type1 !== type2) {
    throw new Error('data types mismatch (' + type1 + ',' + type2+ ')');
  }

  return getSQL(res1, type1, objResource1, objCollection1) + ' = ' + getSQL(res2, type2, objResource2, objCollection2);

};


console.log (parser.IS('$user.name', 'Campaign.creator.name'));

function getType(res) {
  res = res.replace(/^\$user/, 'User');

  if(res.indexOf('.') == -1) {
    return {
      type: res,
      resource: {},
      collection: {}
    };
  }

  // Truong hop
  // - res la number | string | datetime
  // - res la resource
  // - res co chua resource
  // - res la collection

  var arr = res.split('.')
    , resultType
    , objResource = {}
    , objCollection = {};

  _.each(arr, function(key, index){
    if(!resultType){
      if(models[key]){
        resultType = models[key];
      } else {
        resultType = type(res);
      }
    }

    if(resultType[key]){
      resultType = resultType[key].type;
      if(resultType.indexOf('Collec') != -1){
        objCollection[key] = resultType;
      }
      if(models[resultType] && index != arr.length-1){
        objResource[key] = resultType;
        resultType = models[resultType];
      }
    }
  });

  console.log('res %s resultType %s objResource %s',res,  resultType, JSON.stringify(objResource));

  return {
    type: resultType,
    resource: objResource,
    collection: objCollection
  };


//  var code = 'return models.' + res +'.type';
//  var fn = new Function(['models'], code);
//  try {
//    return fn(models);
//  } catch(ex) {
//    console.error('ex', ex);
//    return undefined;
//  }
}

function getSQL(res, type, objResource, objCollection) {
  //** Truong hop type: 1. collection  2. resource   3. number | string | datetime

  if(res.match(/\$user/)) {
    return getSQLWithUser(res);
  }

  // 1. neu type la resource
  if(models[type]){
    var regex = new RegExp('\.' + type.toLowerCase() + '$');
    if(res.match(regex)) {
      return res + '_id';
    }
    return res + '_' + type.toLowerCase() + '_id';
  }

  // 2. res co chứa resource (objResource có data)
  if(!_.isEmpty(objResource)) {
    /*
    * res = "Campaign.creator.name"
    * type = "string"
    * objResource = {creator: 'User'}
    *
    * => (select name from User where User.id = Campaign.creator_user_id)
    * */
    var keys = res.split('.')
      , table1 = keys[0]
      , table2 = objResource[_.keys(objResource)[0]]
      , fieldName1 = keys[keys.length-1]  // field trong mệnh đề SELECT
      , fieldName2 = '' // field trong mệnh đề WHERE
      , fieldName3 = '' // field trong mệnh đề WHERE
      , strQuery = '';

    _.each(keys, function(key, index){
      if(key == _.keys(objResource)[0] && index != 0){
        fieldName2 = table1 + '.' + key + '_' + table2.toLowerCase() + '_id';
        fieldName3 = table2 + '.id';
      }
    });

    strQuery += '(';
    strQuery += 'select ' + fieldName1 + ' from ' + table2 + ' where ' + fieldName3 + ' = ' + fieldName2;
    strQuery += ')';

    return strQuery;

   }

}

function getSQLWithUser(res) {
  if(res.indexOf('.') == -1){
    return config['$user variable'];
  } else {
    res = res.replace('\$', '');
    var arr = res.split('.');

    _.each(arr, function(key){

    });

    return res;
  }

}

//console.log(getSQL('Campaign.creator', 'User')) //=> Campaign.creator_user_id
//console.log(getSQL('Campaign.creative', 'Creative')) //=> Campaign.creator_user_id

//console.log(getType('Campaign.creator'));

/*
 * EQUAL(BANNER.bookingTarget, 2000)
 * STARTWITH(BANNER.name, 'HTC')
 * HAS(CAMPAIGN.creator.name, 'test')
 * OR(IS(USER, CAMPAIGN.creator),IN(USER, CAMPAIGN.creator.managers))
 * */














