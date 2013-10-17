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


parser.IS = function (res1, res2) {
  var type1, type2;

  type1 = getType(res1);
  type2 = getType(res2);

  console.log('typeof res1: ', type1 = getType(res1));
  console.log('typeof res2: ', type2 = getType(res2));

  if(type1 !== type2) {
    throw new Error('data types mismatch (' + type1 + ',' + type2+ ')');
  }

  return getSQL(res1, type1) + ' = ' + getSQL(res2, type2);
  // getSQL(res1) = getSQL(res2);

};

console.log (parser.IS('$user', 'Campaign.creator.name'));

function getType(res) {
  res = res.replace(/^\$user/, 'User');

  if(res.indexOf('.') == -1) {
    return res;
  }

  var code = 'return models.' + res +'.type';
  var fn = new Function(['models'], code);
  try {
    return fn(models);
  } catch(ex) {
    console.error('ex', ex);
    return undefined;
  }
}

function getSQL(res, type) {
  //** Truong hop type: 1. collection  2. resource   3. number | string | datetime

  if(res.match(/\$user/)) {
    return getSQLWithUser(res);
  }

  var regex = new RegExp('\.' + type.toLowerCase() + '$');
  if(res.match(regex)) {
    return res + '_id';
  }
  return res + '_' + type.toLowerCase() + '_id';
}

function getSQLWithUser(res) {
  return config['$user variable'];
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














